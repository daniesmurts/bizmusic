# BizMuzik — Admin Financial Dashboard & Pricing Management
## Developer Prompt

---

## Context

BizMuzik (bizmuzik.ru) is a B2B SaaS music licensing platform for Russian businesses. It operates a referral/ambassador program where ambassadors earn 30% recurring commission on every payment from clients they refer — for life.

The platform has the following subscription tiers (recently revised):

| Tier | Price | Target audience |
|------|-------|-----------------|
| Бизнес | 1,490 ₽/mo | Cafes, retail, salons, offices |
| Контент | 1,790 ₽/mo | Bloggers, SMM, video creators |
| Бизнес Про | 2,490 ₽/mo | Small chains, multi-location businesses |
| Бизнес+ | 4,990 ₽/mo | Networks, agencies, large companies |

---

## What to Build

Build an **Admin Financial Dashboard** as a protected route in the existing admin panel (e.g. `/admin/financials`). It has two main sections:

### 1. Pricing & Fee Management (Settings Panel)

A settings panel where the admin can view and edit:

**Subscription tier prices:**
- For each tier (Бизнес, Контент, Бизнес Про, Бизнес+): editable price field in ₽/month
- Changes must propagate across the entire platform: pricing page, checkout, referral commission calculations, and partner dashboard commission displays
- On save: show a confirmation modal — "Changing prices will affect all new subscriptions and ambassador commission calculations. Existing subscribers will not be affected until their next renewal. Confirm?"
- Grandfathering rule: existing active subscribers stay on their current price until they manually upgrade or their subscription lapses

**Fee & tax settings:**
- Payment processing fee %: editable (default 2.5%) — used in all P&L calculations
- Tax rate % (УСН): editable (default 6%) — used in all P&L calculations  
- Ambassador commission %: editable (default 30%) — changing this affects all future payouts; show a warning that existing ambassador agreements may need to be updated manually
- Minimum payout threshold: editable (default 500 ₽)
- Payout day: dropdown (currently Friday)

All fields must be saved to the database and read dynamically — no hardcoded values anywhere in the codebase for these parameters.

---

### 2. Live Financial Model (P&L Dashboard)

An interactive financial model that reads real subscriber data from the database but also allows manual scenario planning via sliders.

#### Toggle: "Live data" vs "Scenario mode"
- **Live data mode**: pulls actual subscriber counts per tier, actual ambassador count, actual payout history — displays real current P&L
- **Scenario mode**: overrides with manual sliders for planning purposes

#### Metrics to display (update live as inputs change):

**Top metric cards (4 cards):**
1. MRR — total monthly recurring revenue
2. Ambassador payouts — 30% (or current rate) of MRR
3. Total costs — payouts + processing fee + tax + infrastructure fixed costs
4. Net profit — with net margin %

**P&L Waterfall bar chart** showing in sequence:
- Revenue (MRR) — positive bar
- Ambassador payouts — negative bar
- Payment processing fee — negative bar  
- Tax (УСН) — negative bar
- Infrastructure & fixed costs — negative bar
- Net profit — result bar (green if positive, red if negative)

**Unit economics table** — one row per tier:
- Columns: Tier name | Price | Ambassador cut (30%) | Processing fee (2.5%) | Tax (6%) | Net per subscriber | Net margin %
- These columns should recalculate dynamically if fee/tax settings are changed

**Break-even analysis:**
- Calculate: Infrastructure fixed costs ÷ weighted average net revenue per subscriber = break-even subscriber count
- Display: "Break-even at X subscribers" with current status (above/below and by how many)

#### Inputs in Scenario mode:

**Subscriber section:**
- Slider: total active subscribers (1–1000)
- Slider per tier: % allocation (Бизнес, Контент, Бизнес Про, Бизнес+ — remainder auto-calculates)

**Infrastructure section:**
- Slider: number of ambassadors/moms (1–50)
- Input: CRM cost ₽/month
- Input: Cloud ATC cost ₽/month  
- Input: SIM card cost ₽ per ambassador per month
- Input: Other fixed costs ₽/month

**Side-by-side comparison tab:**
- Compare any two pricing scenarios (e.g. old prices vs new prices) at the same subscriber count
- Table showing: MRR, Payouts, Tax, Infrastructure, Net Profit, Net Margin for each scenario + delta column
- Ambassador earnings comparison: what an ambassador earns per client per month under each scenario, per tier

---

## Data & Business Logic

### Commission calculation rules (from existing referral system):
- Ambassador earns 30% (configurable) of each client payment — recurring, for life
- Payout triggers every Friday at 12:00 MSK if accumulated balance ≥ 500 ₽ (configurable threshold)
- If balance < threshold, carries over to next week
- Attribution is fixed at registration — cannot be reassigned later
- If client pauses, ambassador earns 0 for that period but retains attribution
- If client cancels and later resubscribes, ambassador resumes earning

### Price change propagation rules:
- New price applies to: new subscriptions, renewals after the effective date
- Existing active subscribers: grandfathered at their signup price until lapse or manual upgrade
- Ambassador commissions for grandfathered subscribers: calculated on the price the client actually pays (not the new price)
- The ambassador dashboard must show the actual commission amount, not the theoretical one

### Tax logic:
- УСН (simplified tax) is applied to gross revenue (total MRR), not net profit
- Tax % is configurable in the admin panel
- If the business switches tax regime, admin can update the % and all P&L calculations update accordingly

### Processing fee logic:
- Applied as a % of each transaction
- Configurable in admin panel
- Used in P&L calculations and unit economics display

---

## Technical Requirements

- All pricing, fee, tax, and commission parameters must be stored in a single `platform_settings` table (or equivalent config store) — not hardcoded
- The pricing page (`/pricing`), checkout flow, partner dashboard (`/partner`), and this admin dashboard must all read from the same config source
- When admin saves new prices, trigger a cache invalidation for the pricing page
- Admin route must be protected — only users with `role: admin` can access
- All monetary values displayed in Russian rubles (₽), formatted with Russian locale thousands separators (e.g. 4 990 ₽)
- All % inputs should validate: 0–100 range, max 2 decimal places
- All ₽ inputs should validate: positive integers only
- Autosave is off — explicit Save button with confirmation modal for destructive changes (price changes, commission % changes)
- Audit log: every change to pricing/fees should be logged with timestamp, admin user ID, old value, new value

---

## UI/UX Notes

- Three tabs at the top of the dashboard: "Live P&L" | "Scenario Planner" | "Pricing Settings"
- The P&L waterfall and metric cards should feel like a real finance dashboard — not a settings page
- Sliders update all calculations in real time (no submit button needed for scenario mode)
- Pricing Settings tab has explicit Save with confirmation
- Color coding: revenue/profit = green, costs/losses = red/gray, neutral = muted
- Mobile-responsive is not a priority for admin — desktop-first is fine
- Match the existing admin panel's design system

---

## Out of Scope for This Task

- Actual payment processing integration (Stripe, YooKassa, etc.) — assume this already exists
- Ambassador payout execution — assume this already exists  
- Subscriber management UI — assume this already exists
- Authentication — assume admin auth already exists