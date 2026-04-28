import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, leadActivities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractLeadIdFromEmail, cleanEmailBody } from "@/lib/email-helpers";
import fs from "fs";
import path from "path";

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "scratch", "email_debug.log");
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const time = new Date().toISOString();
    fs.appendFileSync(logPath, `[${time}] [INBOUND] ${msg}\n`);
  } catch (e) {}
}

export async function POST(req: NextRequest) {
  // 1. Verify secret
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  logToFile(`Incoming webhook request: ${req.url}`);
  
  if (secret !== process.env.INBOUND_EMAIL_SECRET) {
    logToFile(`VERIFICATION FAILED: secret mismatch. Expected ${process.env.INBOUND_EMAIL_SECRET?.substring(0, 4)}... but got ${secret}`);
    console.warn("[inbound] Invalid secret");
    // Return 200 anyway to prevent Mailgun retries
    return new Response("OK", { status: 200 });
  }

  try {
    // 2. Parse Mailgun multipart form
    const formData = await req.formData();
    const recipient = formData.get("recipient") as string || "";
    const subject = formData.get("subject") as string || "(без темы)";
    const bodyPlain = formData.get("body-plain") as string || "";
    const from = formData.get("from") as string || "";
    const messageId = formData.get("Message-Id") as string || "";

    // 3. Extract lead_id from recipient address
    const leadId = extractLeadIdFromEmail(recipient);
    logToFile(`Parsed data: from=${from}, recipient=${recipient}, subject=${subject}, leadId=${leadId}`);

    if (!leadId) {
      logToFile(`EXTRACTION FAILED: No leadId in recipient ${recipient}`);
      console.log("[inbound] No lead_id in recipient:", recipient);
      return new Response("OK", { status: 200 });
    }

    // 4. Find lead
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      logToFile(`DB FAILED: Lead ${leadId} not found in database`);
      console.log("[inbound] Lead not found:", leadId);
      return new Response("OK", { status: 200 });
    }

    logToFile(`Found lead: ${lead.id}, current status: ${lead.status}`);

    // 5. Clean body
    const cleanedBody = cleanEmailBody(bodyPlain);

    // 6. Log as received activity
    const now = new Date();
    await db.insert(leadActivities).values({
      leadId: leadId,
      agentId: lead.agentId,
      type: "email_received",
      emailSubject: subject,
      emailBodyText: cleanedBody,
      emailFrom: from,
      emailTo: recipient,
      emailMessageId: messageId || null,
      isRead: false,
      note: "Клиент ответил на email",
      createdAt: now,
    });

    // 7. Update lead counters and status
    const updates: any = {
      unreadEmailCount: (lead.unreadEmailCount || 0) + 1,
      lastEmailAt: now,
      updatedAt: now,
    };

    // Upgrade status if still early stage
    if (["new", "no_answer"].includes(lead.status)) {
      updates.status = "in_progress";
    }

    await db.update(leads).set(updates).where(eq(leads.id, leadId));

    logToFile(`✓ SUCCESS: Reply saved and lead updated.`);
    console.log(`[inbound] ✓ Reply saved for lead ${leadId}`);
    return new Response("OK", { status: 200 });

  } catch (err: any) {
    logToFile(`CRITICAL ERROR: ${err.message}`);
    // ALWAYS return 200 — never let Mailgun retry flood the endpoint
    console.error("[inbound] Error:", err);
    return new Response("OK", { status: 200 });
  }
}
