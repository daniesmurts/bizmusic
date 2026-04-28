You are adding a complete email system to the BizMuzik CRM which is 
already built. Stack: Next.js + Supabase. 

KNOWN FACTS — do not re-check these:
✅ Resend is already installed and configured — find and use the 
   existing Resend client, do not create a new one
✅ businesses table already has an email column — do not add it again
✅ bizmuzik.ru is NOT on Cloudflare — use Mailgun for inbound routing

---

## STEP 1 — MANDATORY CODEBASE AUDIT

Read and report on ALL of the following before writing any code:

### Resend (already installed)
1. Find the existing Resend client file — read it completely
2. Find every existing usage of Resend in the codebase
3. Note the exact import pattern and how it's called
4. Confirm RESEND_API_KEY exists in .env.example

### Database
5. Read ALL supabase/migrations/ files
6. Confirm exact column names on: leads, lead_activities, 
   businesses, referral_agents
7. Confirm businesses.email column name exactly
8. Check if lead_activities has any email columns already
9. Check if referral_agents has email_alias column already
10. Check if leads has unread_email_count or last_email_at already

### Existing CRM UI
11. Read /app/dashboard/leads/page.tsx (or equivalent path)
12. Read the lead detail component — find the exact file, read fully
13. Read how lead_activities are currently displayed in the lead card
14. Find how the current user's referral_agent record is fetched
15. Find the existing auth pattern used in API routes

### Report before proceeding:
Summarise exact findings for each point. Flag anything missing.
Ask ONE consolidated question if anything is ambiguous.
Do not write any code until I confirm your summary.

---

## FEATURE: Email System Inside Lead Cards

### Business Context
Sales agents send pre-written email templates directly from lead cards 
in one tap. Client replies appear back in the same lead card 
automatically. Founder sees all email activity in admin panel.

---

## ARCHITECTURE

Outbound (Resend — already configured):
Agent taps template button → CRM pre-fills with client name + 
agent referral link → Agent previews → taps Send
→ /api/email/send uses existing Resend client
→ FROM: [AgentName] из BizMuzik <anna@bizmuzik.ru>
→ Reply-To: reply+[lead_id]@bizmuzik.ru  ← routes replies back
→ Logged in lead_activities as type='email_sent'

Inbound (Mailgun — new setup needed):
Client hits Reply → email goes to reply+[lead_id]@bizmuzik.ru
→ Mailgun Inbound Routes catches it → POSTs to webhook
→ /api/email/inbound parses lead_id → saves to lead_activities
→ Unread badge appears on lead card

---

## STEP 2 — DATABASE MIGRATION

Create a new migration. Skip anything that already exists from audit.

### Extend lead_activities (add only missing columns):
```sql
alter table lead_activities 
  add column if not exists email_subject text,
  add column if not exists email_body_text text,
  add column if not exists email_from text,
  add column if not exists email_to text,
  add column if not exists email_message_id text,
  add column if not exists is_read boolean default true;
```

### Extend leads (add only missing columns):
```sql
alter table leads
  add column if not exists unread_email_count integer not null default 0,
  add column if not exists last_email_at timestamptz;
```

### Extend referral_agents (only if email_alias does NOT exist):
```sql
alter table referral_agents
  add column if not exists email_alias text unique;
  -- e.g. 'anna' → sends/receives at anna@bizmuzik.ru
  -- Set by admin when creating or editing agent
```

---

## STEP 3 — EMAIL TEMPLATES

Create /lib/email-templates.ts

Each template is a function returning { subject, html, text }.

Parameters:
```typescript
interface TemplateParams {
  clientName: string        // contact name or 'Добрый день' fallback
  businessName: string
  agentFirstName: string
  agentPhone?: string
  referralCode: string
  niche: 'salon' | 'retail' | 'auto' | 'cafe' | 'default'
  customNote?: string       // optional line agent adds before signature
}
```

Referral URL in every template:
`https://bizmuzik.ru/r/${referralCode}`

HTML wrapper: clean minimal, max-width 600px, white background, 
no images, works in Gmail, Mail.ru, Yandex.Mail.
Footer: agent first name, BizMuzik.ru, phone if provided.

### Template email_1 — First contact (niche-specific subject):

Subject map:
- salon:   "Проверка РАО — вы готовы? ⚠️"
- retail:  "Ваш магазин и штрафы РАО: важная информация ⚠️"
- auto:    "РАО и музыка в автосалоне: вы под защитой? ⚠️"
- cafe:    "Проверка РАО в кафе — вы защищены? ⚠️"
- default: "Проверка РАО — вы готовы? ⚠️"

Body salon:
Здравствуйте, [clientName]!

С начала 2024 года РАО резко усилило проверки в салонах красоты. 
Штраф — до 25 000 ₽ за каждую песню. Яндекс.Музыка, Spotify, 
YouTube — не защищают. Даже тихая фоновая музыка считается 
публичным исполнением по ст. 1243 ГК РФ.

Один рейд может обойтись в сотни тысяч рублей.

Мы в Bizmuzik.ru решаем это раз и навсегда.

За 990 ₽ в месяц вы получаете:
— Легальную музыку с прямой лицензией (без РАО и ВОИС)
— Официальный сертификат с вашим ИНН — закрывает любую проверку
— Плейлисты для beauty-сферы: джаз, lounge, фоновый поп
— Голосовые объявления об акциях профессиональным голосом

14 дней бесплатно — без привязки карты.
→ [referralUrl]

Body retail:
Здравствуйте, [clientName]!

Пишу по конкретному юридическому вопросу, который касается 
большинства магазинов.

Если у вас в торговом зале играет музыка — вы, скорее всего, 
нарушаете закон об авторских правах. Яндекс.Музыка, ВКонтакте, 
радио через телефон не дают права на публичное воспроизведение 
по ст. 1243 ГК РФ.

Штраф РАО: до 25 000 ₽ за каждый трек. Магазин с 10-часовым 
рабочим днём воспроизводит ~150 треков в сутки. Инспектор может 
зайти как обычный покупатель — вы не узнаете заранее.

За 990 ₽ в месяц — полная защита:
— Прямая лицензия: никаких РАО, никаких ВОИС
— Сертификат с вашим ИНН для любой проверки
— Работает на любом устройстве без оборудования

14 дней бесплатно — карта не нужна.
→ [referralUrl]

Body auto:
Здравствуйте, [clientName]!

Пишу по конкретному юридическому вопросу.

С 2024 года РАО усилило проверки коммерческих объектов — 
автосалоны входят в зону активного мониторинга. Штраф за 
публичное воспроизведение музыки без лицензии — до 25 000 ₽ 
за каждый трек. При нескольких зонах (шоурум, зона ожидания, 
сервис) сумма иска: от 300 000 до 1 000 000 ₽.

Яндекс.Музыка, радио — не защищают.

Bizmuzik.ru: 990 ₽ в месяц, все зоны покрыты одной подпиской:
— Прямая лицензия, никаких РАО
— Сертификат с ИНН для любой проверки
— Отдельные режимы для шоурума, зоны ожидания, сервиса

14 дней бесплатно — без привязки карты.
→ [referralUrl]

Body default/cafe:
Здравствуйте, [clientName]!

С начала 2024 года РАО активно проверяет заведения и штрафует 
за музыку без лицензии — до 25 000 ₽ за каждый трек. 
Яндекс.Музыка, Spotify, радио — не защищают юридически.

Bizmuzik.ru решает это за 990 ₽/мес:
— Официальная лицензия, никаких РАО
— Сертификат с вашим ИНН — закрывает любую проверку
— 14 дней бесплатно, карта не нужна

→ [referralUrl]

### Template email_2 — Follow-up day 3 (all niches):

Subject: "Один документ — и любая проверка не страшна"

Body:
Здравствуйте, [clientName]!

Три дня назад писал(а) вам про штрафы РАО. Хочу добавить 
кое-что конкретное.

Каждый наш клиент сразу получает Сертификат соответствия — 
документ с ИНН организации и сроком действия лицензии. 
Инспектор приходит — вы показываете его. Вопрос закрыт.

Большинство проверок начинаются по жалобам — от конкурентов, 
соседей, бывших сотрудников. РАО не предупреждает заранее.

14 дней бесплатно, без привязки карты:
→ [referralUrl]

Или ответьте — пришлю образец сертификата прямо сюда.

### Template email_3 — Final day 7 (all niches):

Subject: "Последнее письмо — и один вопрос"

Body:
Здравствуйте, [clientName]!

Это последнее письмо — не хочу занимать лишнее место.

Один вопрос: сколько часов в день у вас играет музыка?

Если больше восьми — каждый день вы воспроизводите 100+ 
треков без лицензии. 990 рублей в месяц закрывают этот риск.

→ [referralUrl]
14 дней бесплатно. Карта не нужна. Отмена в один клик.

Всего доброго,

---

## STEP 4 — RESEND HELPERS

Do NOT create a new Resend client — use the existing one found in audit.

Create or extend /lib/email-helpers.ts (separate from existing Resend 
file to avoid conflicts):

```typescript
export const BIZMUZIK_DOMAIN = 'bizmuzik.ru'

export function getAgentFromAddress(
  agentAlias: string, 
  agentFirstName: string
): string {
  return `${agentFirstName} из BizMuzik <${agentAlias}@${BIZMUZIK_DOMAIN}>`
}

export function getReplyToAddress(leadId: string): string {
  return `reply+${leadId}@${BIZMUZIK_DOMAIN}`
}

export function extractLeadIdFromEmail(toAddress: string): string | null {
  const match = toAddress.match(/reply\+([a-zA-Z0-9-]+)@bizmuzik\.ru/)
  return match ? match[1] : null
}

export function cleanEmailBody(rawText: string): string {
  return rawText
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .filter(line => !line.trim().startsWith('On '))
    .join('\n')
    .trim()
    .substring(0, 2000)
}

export function getNicheFromBusinessNiche(nicheName: string): 
  'salon' | 'retail' | 'auto' | 'cafe' | 'default' {
  const n = nicheName.toLowerCase()
  if (n.includes('салон') || n.includes('красот')) return 'salon'
  if (n.includes('магаз') || n.includes('ритейл')) return 'retail'
  if (n.includes('авто')) return 'auto'
  if (n.includes('кафе') || n.includes('ресторан') || 
      n.includes('бар') || n.includes('кофе')) return 'cafe'
  return 'default'
}
```

---

## STEP 5 — SEND EMAIL API ROUTE

Create: /app/api/email/send/route.ts
Use the existing auth pattern found in Step 1 audit.
Use the existing Resend client found in Step 1 audit.

```typescript
export async function POST(req: Request) {
  // Auth: use existing pattern
  const user = await getCurrentUser(req) // use existing auth util
  if (!user) return Response.json({ error: 'Unauthorized' }, 
    { status: 401 })

  const body = await req.json()
  const { leadId, templateId, customNote } = body

  if (!leadId || !templateId) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get agent — verify they have email_alias set
  const { data: agent } = await supabaseAdmin
    .from('referral_agents')
    .select('id, full_name, email_alias, referral_code')
    .eq('user_id', user.id)
    .single()

  if (!agent) return Response.json(
    { error: 'Not an agent' }, { status: 403 })
  
  if (!agent.email_alias) return Response.json({
    error: 'NO_ALIAS',
    message: 'Email alias не настроен. Обратитесь к администратору.'
  }, { status: 400 })

  // Get lead — verify ownership (SECURITY CRITICAL)
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select(`
      id, status, agent_id,
      businesses (
        id, name, email,
        business_niches ( name )
      )
    `)
    .eq('id', leadId)
    .eq('agent_id', agent.id)
    .single()

  if (!lead) return Response.json(
    { error: 'Lead not found' }, { status: 404 })

  // Check business has email
  const businessEmail = lead.businesses?.email
  if (!businessEmail) {
    return Response.json({
      error: 'NO_EMAIL',
      message: 'У этого бизнеса нет email. Добавьте адрес в карточке.'
    }, { status: 400 })
  }

  // Build template
  const agentFirstName = agent.full_name?.split(' ')[0] || 'Менеджер'
  const nicheName = lead.businesses?.business_niches?.name || ''
  const niche = getNicheFromBusinessNiche(nicheName)

  const template = getEmailTemplate(templateId, {
    clientName: 'Добрый день',
    businessName: lead.businesses.name,
    agentFirstName,
    referralCode: agent.referral_code,
    niche,
    customNote,
  })

  // Send — use existing resend instance
  const { data: sendData, error: sendError } = await resend.emails.send({
    from: getAgentFromAddress(agent.email_alias, agentFirstName),
    to: [businessEmail],
    replyTo: getReplyToAddress(leadId),
    subject: template.subject,
    html: template.html,
    text: template.text,
  })

  if (sendError) {
    console.error('[email/send] Resend error:', sendError)
    return Response.json({ error: sendError.message }, { status: 500 })
  }

  // Log activity — match existing lead_activities insert pattern
  await supabaseAdmin.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: agent.id,
    type: 'email_sent',
    email_subject: template.subject,
    email_body_text: template.text.substring(0, 2000),
    email_to: businessEmail,
    email_message_id: sendData?.id || null,
    is_read: true,
    note: templateId === 'email_1' 
      ? 'Отправлен первый email'
      : templateId === 'email_2' 
      ? 'Отправлен follow-up email (день 3)'
      : 'Отправлен финальный email (день 7)'
  })

  // Update lead
  const updates: Record<string, unknown> = {
    last_email_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Auto-schedule 3-day follow-up
    next_callback_at: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }
  // Move 'new' leads to 'no_answer' on first email
  if (templateId === 'email_1' && lead.status === 'new') {
    updates.status = 'no_answer'
  }

  await supabaseAdmin.from('leads').update(updates).eq('id', leadId)

  return Response.json({ success: true, messageId: sendData?.id })
}
```

---

## STEP 6 — INBOUND EMAIL WEBHOOK

Install: npm install mailparser
Install types: npm install --save-dev @types/mailparser

Create: /app/api/email/inbound/route.ts

IMPORTANT: Mailgun POSTs as multipart/form-data with a 'body-plain' 
field and a 'recipient' field. Parse accordingly.

```typescript
import { NextRequest } from 'next/server'
// Do not import simpleParser — Mailgun sends parsed fields directly

export async function POST(req: NextRequest) {
  // 1. Verify secret
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (secret !== process.env.INBOUND_EMAIL_SECRET) {
    // Return 200 anyway — Mailgun retries on non-200
    console.warn('[inbound] Invalid secret')
    return new Response('OK', { status: 200 })
  }

  try {
    // 2. Parse Mailgun multipart form
    const formData = await req.formData()
    const recipient = formData.get('recipient') as string || ''
    const subject = formData.get('subject') as string || '(без темы)'
    const bodyPlain = formData.get('body-plain') as string || ''
    const from = formData.get('from') as string || ''
    const messageId = formData.get('Message-Id') as string || ''

    // 3. Extract lead_id from recipient address
    const leadId = extractLeadIdFromEmail(recipient)
    if (!leadId) {
      console.log('[inbound] No lead_id in recipient:', recipient)
      return new Response('OK', { status: 200 })
    }

    // 4. Find lead
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id, agent_id, unread_email_count, status')
      .eq('id', leadId)
      .single()

    if (!lead) {
      console.log('[inbound] Lead not found:', leadId)
      return new Response('OK', { status: 200 })
    }

    // 5. Clean body
    const cleanedBody = cleanEmailBody(bodyPlain)

    // 6. Log as received activity
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: leadId,
      agent_id: lead.agent_id,
      type: 'email_received',
      email_subject: subject,
      email_body_text: cleanedBody,
      email_from: from,
      email_message_id: messageId || null,
      is_read: false,
      note: 'Клиент ответил на email'
    })

    // 7. Update lead counters and status
    await supabaseAdmin
      .from('leads')
      .update({
        unread_email_count: (lead.unread_email_count || 0) + 1,
        last_email_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // Upgrade status if still early stage
    if (['new', 'no_answer'].includes(lead.status)) {
      await supabaseAdmin
        .from('leads')
        .update({ status: 'in_progress' })
        .eq('id', leadId)
    }

    console.log(`[inbound] ✓ Reply saved for lead ${leadId}`)
    return new Response('OK', { status: 200 })

  } catch (err) {
    // ALWAYS return 200 — never let Mailgun retry flood the endpoint
    console.error('[inbound] Error:', err)
    return new Response('OK', { status: 200 })
  }
}
```

Add to .env.example:
INBOUND_EMAIL_SECRET=generate_with_openssl_rand_hex_32

---

## STEP 7 — UI: EMAIL SECTION IN LEAD DETAIL

Read the existing lead detail component fully before modifying.
Add the email section below the existing activity log.
Match the existing component style, spacing, and component library exactly.

### Mark emails as read on open:
When the lead detail opens and there are unread emails, call a 
server action that:
1. Sets is_read = true on all email_received activities for this lead
2. Sets lead.unread_email_count = 0
Do this silently in the background — do not block the UI.

### Email thread:
Filter lead_activities where type IN ('email_sent', 'email_received')
Show chronologically, oldest first, newest at bottom.

Sent bubble (right-aligned, subtle blue/info background):
- Label: "Вы отправили" + templateId label + timestamp
- Subject line in bold
- Body preview (first 100 chars) — tap to expand full body
- Small: "Отправлено на [email]"

Received bubble (left-aligned, white with border, orange accent 
if is_read = false):
- Label: "Ответ клиента" + timestamp
- Subject line
- Full cleaned body text
- "от [email_from]"

Empty state (no email activities):
"Писем ещё нет — отправьте первый шаблон ниже ↓"

### Template selector:
Three buttons, stacked on mobile, row on desktop.

For each button, check emailActivities to show status:
- email_1 button: 
  - Not sent → "📧 Email 1 — Первый контакт"
  - Sent → "✓ Email 1 отправлен [X дней назад]" (muted, still tappable)
- email_2 button:
  - Disabled + grayed if email_1 not sent yet
  - Tooltip: "Сначала отправьте Email 1"
  - Available → "📧 Email 2 — Follow-up (день 3)"
  - Sent → "✓ Email 2 отправлен"
- email_3 button:
  - Disabled if email_2 not sent
  - Available → "📧 Email 3 — Финальный (день 7)"
  - Sent → "✓ Email 3 отправлен"

On template button tap → open preview panel (bottom sheet mobile):
- Header: "Предварительный просмотр"
- Subject displayed prominently
- Full email body (scrollable, read-only)
- Optional note field: "Добавить заметку клиенту (необязательно)"
  Placeholder: "Например: встретила вас вчера на Пушкинской..."
  Max 200 chars
- If businesses.email is null: show warning + inline email input 
  with save button before showing Send button
- "Отправить" button → POST /api/email/send
  Loading state: "Отправляю..."
  Success: close sheet, toast "Письмо отправлено ✓", refresh activities
  Error NO_EMAIL: highlight email field, "Добавьте email"
  Error NO_ALIAS: "Обратитесь к администратору для настройки email"
  Error other: toast "Ошибка отправки — попробуйте ещё раз"

### Unread badge:
In lead card list: show orange dot on leads where 
unread_email_count > 0. Position: top-right of card or next to 
business name.

In pipeline tabs: show count badge on tab if any leads in that 
tab have unread replies.

---

## STEP 8 — ADMIN PANEL ADDITIONS

### /admin/affiliates — Agent creation/edit form:
Add "Email alias" field when creating or editing an agent.
- Input: letters and numbers only, auto-lowercased
- Auto-suggest: first name transliterated to Latin lowercase
  (e.g. "Анна" → "anna", "Мария" → "maria")
- Helper text below field: 
  "Агент будет отправлять с [alias]@bizmuzik.ru"
  Updates live as admin types.
- Validate: unique against referral_agents.email_alias
- Save to referral_agents.email_alias

### /admin/leads — Activity tab:
Extend existing feed to distinguish email events:

email_sent row:
[📤] [time] [Agent name] → отправила [Email 1/2/3] → [Business name]

email_received row (highlighted, amber/orange left border):
[📥] [time] [Business name] → ответил(а) на письмо [Agent name]
     ← НОВЫЙ ОТВЕТ (if is_read = false)

### /admin/leads — Overview/stats:
Add 4 new stat cards:
- Писем сегодня: COUNT email_sent today
- Ответов сегодня: COUNT email_received today  
- Без ответа: COUNT leads where last email_sent > 3 days ago 
  and no email_received after it
- Процент ответов: (email_received / email_sent) × 100% this month

---

## STEP 9 — MAILGUN SETUP DOCUMENTATION

Create /docs/email-setup.md:

# BizMuzik Email Setup Guide

## Overview
- Resend: sends outbound emails (already configured ✅)
- Mailgun: receives inbound replies and forwards to webhook

## Step 1 — Create Mailgun account
1. Go to mailgun.com → Sign up (free tier: 1,000 emails/month)
2. Go to Sending → Domains → Add New Domain
3. Enter: mg.bizmuzik.ru (use subdomain, not root domain)

## Step 2 — Add DNS records at your domain registrar
Mailgun will give you DNS records to add. Add them at wherever 
bizmuzik.ru DNS is managed (Reg.ru, RU-CENTER, etc):
- 2× MX records for mg.bizmuzik.ru
- TXT record for SPF
- TXT record for DKIM

## Step 3 — Configure Inbound Routing in Mailgun
1. Mailgun dashboard → Receiving → Create Route
2. Filter expression: match_recipient("reply\+.*@mg\.bizmuzik\.ru")
3. Actions: forward("https://bizmuzik.ru/api/email/inbound?secret=YOUR_SECRET")
4. Priority: 10
5. Save

## Step 4 — Update Resend domain config
In Resend dashboard, your sending domain is bizmuzik.ru (already set).
The Reply-To will use mg.bizmuzik.ru for inbound — this is correct.
No changes needed to Resend.

## Step 5 — Environment variables
Add to .env.local:
INBOUND_EMAIL_SECRET=<output of: openssl rand -hex 32>

## Step 6 — Set up agent email aliases
1. Go to /admin/affiliates
2. Edit each agent → set email_alias (e.g. "anna")
3. Agent can now send from anna@bizmuzik.ru

## Testing inbound
Send a test email to reply+[any-real-lead-id]@mg.bizmuzik.ru
Check /admin/leads activity feed for the received entry.

---

## CRITICAL CONSTRAINTS

- Use existing Resend client exactly as found in audit — 
  do not create a new one or change import paths
- Do not add businesses.email migration — column already exists
- Agent can ONLY email their own leads — enforce in /api/email/send
- Always return HTTP 200 from /api/email/inbound regardless of errors
- All UI must match existing design system exactly
- Mobile-first — template buttons must be easily tappable at 375px
- Use supabaseAdmin (service role) for all API route writes
- Use existing auth pattern from audit — do not create new auth logic
- Never store email HTML in DB — text version only, max 2000 chars

---

## DO NOT
- Do not install mailparser (Mailgun sends pre-parsed fields)
- Do not install nodemailer or any SMTP library
- Do not create a new Resend instance
- Do not add businesses.email column (already exists)
- Do not redesign existing lead card — extend it only
- Do not add a separate email page or navigation item
- Do not add any paid services beyond Mailgun free tier

---

## DELIVERABLES CHECKLIST
[ ] Migration: email columns on lead_activities, unread_email_count 
    + last_email_at on leads, email_alias on referral_agents
[ ] /lib/email-templates.ts — 3 templates × 5 niches
[ ] /lib/email-helpers.ts — helper functions
[ ] /api/email/send — full send route using existing Resend client
[ ] /api/email/inbound — Mailgun webhook, always returns 200
[ ] Lead detail: email thread (sent + received bubbles)
[ ] Lead detail: template selector with sent status indicators
[ ] Lead detail: preview bottom sheet with optional note field
[ ] Lead detail: mark-as-read on open (background, silent)
[ ] Lead card list: unread email orange dot badge
[ ] Pipeline tabs: unread reply count badges
[ ] Admin agent form: email_alias field with live preview
[ ] Admin activity feed: email events with distinct styling
[ ] Admin overview: 4 email stat cards
[ ] /docs/email-setup.md — complete Mailgun + DNS steps
[ ] INBOUND_EMAIL_SECRET added to .env.example
[ ] All existing functionality unchanged