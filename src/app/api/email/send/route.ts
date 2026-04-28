import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, leadActivities, referralAgents, crmBusinesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { resend } from "@/lib/email";
import { getEmailTemplate } from "@/lib/email-templates";
import { getAgentFromAddress, getReplyToAddress, getNicheFromBusinessNiche } from "@/lib/email-helpers";
import fs from "fs";
import path from "path";

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "scratch", "email_debug.log");
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const time = new Date().toISOString();
    fs.appendFileSync(logPath, `[${time}] [SEND] ${msg}\n`);
  } catch (e) {}
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, templateId, customNote } = body;
    logToFile(`START: leadId=${leadId}, templateId=${templateId}`);

    if (!leadId || !templateId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2. Get agent details
    const agent = await db.query.referralAgents.findFirst({
      where: eq(referralAgents.userId, user.id),
    });

    if (!agent) {
      return NextResponse.json({ error: "Not an agent" }, { status: 403 });
    }

    if (!agent.emailAlias) {
      return NextResponse.json({
        error: "NO_ALIAS",
        message: "Email alias не настроен. Обратитесь к администратору."
      }, { status: 400 });
    }

    // 3. Get lead & business details (with ownership check)
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.agentId, agent.id)),
      with: {
        business: {
          with: {
            niche: true,
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const businessEmail = lead.business?.email;
    if (!businessEmail) {
      return NextResponse.json({
        error: "NO_EMAIL",
        message: "У этого бизнеса нет email. Добавьте адрес в карточке."
      }, { status: 400 });
    }

    // 4. Build template
    const agentFirstName = agent.fullName?.split(' ')[0] || "Менеджер";
    const nicheName = lead.business?.niche?.name || "";
    const niche = getNicheFromBusinessNiche(nicheName);

    const template = getEmailTemplate(templateId, {
      clientName: lead.business?.contactName || "Добрый день",
      businessName: lead.business?.name || "",
      agentFirstName,
      agentPhone: agent.phone || undefined,
      referralCode: agent.referralCode,
      niche,
      customNote,
    });

    // 5. Send via Resend
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: getAgentFromAddress(agent.emailAlias, agentFirstName),
      to: [businessEmail],
      replyTo: getReplyToAddress(leadId),
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (sendError) {
      logToFile(`RESEND ERROR: ${JSON.stringify(sendError)}`);
      console.error("[email/send] Resend API error:", sendError);
      return NextResponse.json({ 
        error: "RESEND_ERROR", 
        message: sendError.message,
        details: sendError
      }, { status: 500 });
    }

    logToFile(`Resend SUCCESS: id=${sendData?.id}`);

    // 6. Log activity
    const now = new Date();
    try {
      logToFile(`DB: Logging activity...`);
      await db.insert(leadActivities).values({
        leadId,
        agentId: agent.id,
        type: "email_sent",
        emailSubject: template.subject,
        emailBodyText: template.text.substring(0, 2000),
        emailTo: businessEmail,
        emailMessageId: sendData?.id || null,
        isRead: true,
        note: templateId === 'email_1' 
          ? 'Отправлен первый email'
          : templateId === 'email_2' 
          ? 'Отправлен follow-up email (день 3)'
          : 'Отправлен финальный email (день 7)',
        createdAt: now,
      });

      // 7. Update lead record
      logToFile(`DB: Updating lead status...`);
      const updates: any = {
        lastEmailAt: now,
        updatedAt: now,
        nextCallbackAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };

      if (templateId === 'email_1' && lead.status === 'new') {
        updates.status = 'no_answer';
      }

      await db.update(leads).set(updates).where(eq(leads.id, leadId));
      logToFile(`DB: SUCCESS.`);
    } catch (dbErr: any) {
      logToFile(`DB ERROR: ${dbErr.message} | DETAILS: ${JSON.stringify(dbErr)}`);
      console.error("[email/send] Database logging failed:", dbErr);
      // We still return success because the email was SENT
      return NextResponse.json({ 
        success: true, 
        messageId: sendData?.id,
        warning: "Email sent but activity logging failed" 
      });
    }

    return NextResponse.json({ success: true, messageId: sendData?.id });

  } catch (error: any) {
    console.error("[email/send] Uncaught Error:", error);
    return NextResponse.json({ 
      error: "INTERNAL_ERROR", 
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
