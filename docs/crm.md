You are extending the BizMuzik (bizmuzik.ru) Next.js + Supabase platform with a 
lightweight Sales CRM for managing a team of commission-based sales agents.

## STEP 1 — AUDIT FIRST
Read the full codebase before writing anything:
1. All supabase/migrations/ files — understand the full existing schema
2. The referral_agents table already built — this CRM extends it
3. Existing dashboard layout and UI components
4. Auth/session pattern in use
5. Report findings before proceeding

## FEATURE: Sales CRM

### Business Context
We have a team of stay-at-home mom sales agents. Each agent is assigned a list of 
local businesses to cold-call and sell BizMuzik subscriptions. We need to track every 
lead, every call attempt, and every follow-up. The admin (founder) assigns leads to 
agents and monitors all activity.

---

## DATABASE MIGRATION

Create a new migration file.

**cities**
```sql
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  is_active boolean default true
);
insert into cities (name, region) values 
  ('Москва', 'Центральный'),('Санкт-Петербург', 'Северо-Западный'),
  ('Краснодар', 'Южный'),('Екатеринбург', 'Уральский'),
  ('Новосибирск', 'Сибирский'),('Казань', 'Приволжский'),
  ('Ростов-на-Дону', 'Южный'),('Нижний Новгород', 'Приволжский');
```

**business_niches**
```sql
create table business_niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text -- emoji icon e.g. ☕ 🍽️ 💇 🛍️
);
insert into business_niches (name, icon) values 
  ('Кафе и кофейни','☕'),('Рестораны и бары','🍽️'),
  ('Салоны красоты','💇'),('Магазины и ритейл','🛍️'),
  ('Офисы и коворкинги','🏢'),('Фитнес и спорт','🏋️'),
  ('Автосалоны','🚗'),('Супермаркеты','🛒'),
  ('Медицинские клиники','🏥'),('Отели и хостелы','🏨');
```

**businesses**
```sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city_id uuid references cities(id),
  niche_id uuid references business_niches(id),
  address text,
  phone text,
  website text,
  contact_name text,
  source text default 'manual', -- 'manual', '2gis', 'avito', 'yandex'
  is_assigned boolean default false,
  created_at timestamptz default now()
);
create index on businesses(city_id, niche_id);
create index on businesses(is_assigned);
```

**leads**
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  agent_id uuid not null references referral_agents(id) on delete cascade,
  status text not null default 'new' check (status in (
    'new',          -- assigned, not yet contacted
    'no_answer',    -- called, no answer
    'in_progress',  -- talking, interested
    'trial_sent',   -- registered for free trial
    'converted',    -- paid subscription
    'rejected',     -- said no
    'invalid'       -- wrong number / closed business
  )),
  priority integer default 2 check (priority in (1,2,3)), -- 1=hot,2=normal,3=low
  next_callback_at timestamptz,
  converted_at timestamptz,
  converted_subscription_id text,
  call_attempts integer default 0,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on leads(agent_id, status);
create index on leads(agent_id, next_callback_at);
create index on leads(status);
```

**lead_activities**
```sql
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid not null references referral_agents(id),
  type text not null check (type in (
    'call_attempt','call_connected','status_change',
    'note','callback_scheduled','trial_sent','converted'
  )),
  note text,
  previous_status text,
  new_status text,
  callback_at timestamptz,
  created_at timestamptz default now()
);
create index on lead_activities(lead_id);
create index on lead_activities(agent_id, created_at desc);
```

**agent_assignments** (which city+niche combos belong to which agent)
```sql
create table agent_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references referral_agents(id) on delete cascade,
  city_id uuid references cities(id),
  niche_id uuid references business_niches(id),
  created_at timestamptz default now(),
  unique(agent_id, city_id, niche_id)
);
```

### RLS Policies:
- leads: agents see only their own (agent_id = current user's referral_agent id)
- lead_activities: agents see only their own
- businesses: all authenticated users can read, only admin can insert/update
- admin has full access to all tables

---

## PAGES TO BUILD

### 1. /dashboard/leads — Agent Lead Pipeline

This is the main working screen for agents. Mobile-first design — agents use phones.

**Top section — Daily Focus**
A card showing "Ваши звонки на сегодня" — leads where next_callback_at is today 
or overdue, ordered by priority then by next_callback_at.
Show count badge. If 0, show motivational message "Отлично! Новых звонков нет. 
Хотите взять новые лиды?"

**Pipeline tabs** (horizontal scrollable on mobile):
Новые | Без ответа | В работе | Пробный период | Отказ

Each tab shows a list of lead cards.

**Lead Card** shows:
- Business name + niche icon + city
- Phone number (tap to open WhatsApp: wa.me/7XXXXXXXXXX)
- Last activity summary (e.g. "Звонили 2 дня назад")
- Next callback date if set
- Priority indicator (🔴 hot / 🟡 normal / 🟢 low)
- "Открыть" button → opens lead detail modal/sheet

**Lead Detail Modal/Sheet (bottom sheet on mobile):**
- Business info: name, address, phone, website, niche, city
- Contact name if set (editable inline)
- Status selector (big colored buttons for each status)
- Call script accordion — show the relevant sales script based on niche:
  * All niches: show the standard cold call script (see script below)
- Activity log — chronological list of all past activities on this lead
- Add note text field + "Сохранить заметку" button
- Schedule callback: date+time picker + "Поставить напоминание" button
- When status changed to 'trial_sent': show referral link to copy and send to client
- When status changed to 'converted': prompt to enter subscription ID

**Embedded Scripts by Niche** (shown inside lead card, collapsible):
Salon script:
"Добрый день! [Имя клиента]? Меня зовут [Имя], сервис BizMuzik. 
Вы знаете, что РАО штрафует салоны красоты за музыку без лицензии — до 25 000₽ 
за трек? Мы защищаем от этого за 990₽/месяц. Есть 2 минуты?"

Cafe script:
"Добрый день! Это [название кафе]? Меня зовут [Имя], сервис BizMuzik.
Хочу предупредить — РАО активно проверяет кафе в вашем районе. 
Штраф за каждую песню без лицензии — до 25 000₽. 
Мы решаем это за 990₽/месяц с полным пакетом документов. Есть минута?"

Default script (all others):
"Добрый день! Меня зовут [Имя], сервис BizMuzik — легальная музыка для бизнеса.
Вы знаете о штрафах РАО за музыку без лицензии? До 25 000₽ за каждый трек.
Мы защищаем от этих штрафов за 990₽/месяц. Удобно говорить?"

---

### 2. /dashboard/leads/stats — Agent Stats Page

- Calls made today / this week / this month
- Pipeline funnel visualization (count per status)
- Conversion rate (converted / total leads)
- Average call attempts before conversion
- Commission earned from converted leads (pull from commission_ledger)
- Personal leaderboard rank (your position among all agents this month by conversions)

---

### 3. /admin/leads — Admin Lead Management

**Tab 1: Бизнес-база (Business Database)**
- Table of all businesses with filters: city, niche, assigned/unassigned
- "Импорт CSV" button → accepts CSV with columns: 
  name, phone, address, city, niche (fuzzy match city/niche names)
  Show import preview with row count before confirming
- "Назначить" button → assign selected unassigned businesses to an agent
  Opens modal: select agent, confirm. Creates lead records for each business.
- Manual "Добавить бизнес" button → form to add single business

**Tab 2: Агенты (Team Overview)**
- Table: Agent name | City/Niche assignments | Total leads | 
  Calls today | In progress | Trial | Converted this month | Last active
- Click agent row → drill-down page showing all their leads and recent activity
- "Назначить лиды" button per agent → opens assignment flow

**Tab 3: Активность (Activity Feed)**
- Real-time feed of all agent activity across the whole team
  (lead status changes, notes, calls logged)
- Filter by agent, by date range
- Shows: [Time] [Agent name] [Action] [Business name]
  e.g. "14:23 — Анна К. → перевела Кафе Уют в 'Пробный период'"

**Tab 4: Воронка (Funnel)**
- Aggregate pipeline across all agents
- Funnel chart: New → No answer → In progress → Trial → Converted
- Conversion rate at each stage
- Filter by city, niche, agent, date range

---

## ACTIONS & SERVER LOGIC

### Update lead status (server action):
When agent changes a lead's status:
1. Update leads.status and leads.updated_at
2. If new status is a call-related status, increment leads.call_attempts
   and set leads.last_contacted_at = now()
3. Insert into lead_activities: type='status_change', previous/new status, agent_id
4. If status = 'converted': set leads.converted_at = now()
5. Return updated lead

### Schedule callback (server action):
1. Update leads.next_callback_at
2. Insert into lead_activities: type='callback_scheduled', callback_at
3. Return updated lead

### Add note (server action):
1. Insert into lead_activities: type='note', note text, agent_id, lead_id
2. Return activity record

### Bulk lead assignment (admin server action):
1. Accept: array of business_ids, agent_id
2. For each business_id:
   - Create a leads record: business_id, agent_id, status='new'
   - Set businesses.is_assigned = true
3. Use a transaction / loop with error handling
4. Return count of leads created

### CSV Import (admin):
1. Accept CSV upload (multipart form)
2. Parse CSV — columns: name, phone, address, city, niche
3. Fuzzy match city to cities table (case insensitive, trim)
4. Fuzzy match niche to business_niches table
5. Show preview: X rows parsed, Y matched cities, Z unmatched (list them)
6. On confirm: bulk insert into businesses
7. Return import summary

---

## UI REQUIREMENTS

- Match existing BizMuzik design system exactly — read existing components first
- Agent screens must be fully usable on mobile (375px viewport)
- Phone numbers must be tappable → open WhatsApp (wa.me/ format)
- Status changes must feel instant (optimistic UI updates)
- The lead detail should open as a bottom sheet on mobile, modal on desktop
- Use Russian language for all labels, buttons, and messages
- Pipeline tab counts must update in real-time or on refocus
- Empty states should be helpful: explain what to do next, not just "no data"

---

## NOTIFICATIONS (basic version — Telegram)
If a Telegram bot token exists in env (TELEGRAM_BOT_TOKEN), send:
- Agent gets a Telegram message when new leads are assigned to them
- Admin gets a daily summary at 20:00: total calls today, trials sent, conversions
  (set up as a cron at /api/cron/daily-summary)
If no Telegram token found, skip notifications silently and add TODO comment.

---

## DO NOT
- Do not touch auth, referral, or payment code
- Do not add paid services or new npm packages without asking
- Do not redesign existing pages

---

## DELIVERABLES CHECKLIST
[x] Migration: cities, business_niches, businesses, leads, 
    lead_activities, agent_assignments + RLS
[x] /dashboard/leads pipeline page (mobile-first)
[x] /dashboard/leads/stats agent stats page  
[x] Lead detail bottom sheet/modal with scripts, activity log, actions
[x] /admin/leads with 4 tabs (database, agents, activity, funnel)
[x] CSV import for businesses
[x] Bulk lead assignment flow
[x] All server actions (status update, note, callback, assignment)
[x] Telegram notification hooks (if env var present)
[ ] Seed script: 3 cities, 5 niches, 20 businesses, 2 agents, 10 leads