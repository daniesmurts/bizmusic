# 📧 Email System Setup Guide (Mailgun + Resend)

This guide outlines the steps required to configure DNS and Mailgun for the BizMuzik CRM email system.

## 1. Domain Configuration (DNS)

We use **Resend** for outbound emails and **Mailgun** for inbound replies.

### Outbound (Resend)
Ensure your domain `bizmuzik.ru` is verified in Resend.
1. Add the SPF, DKIM, and DMARC records provided in the Resend Dashboard.
2. Verify that `RESEND_API_KEY` is set in your `.env.local`.

### Inbound (Mailgun)
We use a subdomain for inbound processing: `mg.bizmuzik.ru`.
1. **Add Domain**: In Mailgun, add `mg.bizmuzik.ru`.
2. **DNS Records**:
   - **MX**: `10 mxa.mailgun.org` and `10 mxb.mailgun.org` for `mg.bizmuzik.ru`.
   - **TXT**: Add the SPF and DKIM records provided by Mailgun for the subdomain.

## 2. Mailgun Route Configuration

To capture replies and send them to our CRM, configure a **Route** in Mailgun:

1. **Expression Type**: `Catch All` (or `Match Recipient` with `reply\+.*@mg\.bizmuzik\.ru`).
2. **Action**: `Forward` to `https://bizmuzik.ru/api/email/inbound?secret=[YOUR_INBOUND_EMAIL_SECRET]`.

## 3. Environment Variables

Ensure these are set in your production environment:

```bash
# Found in Resend Settings
RESEND_API_KEY="re_xxxxxxxx"

# Generate a long random hex string
INBOUND_EMAIL_SECRET="your_generated_secret_here"
```

## 4. Agent Configuration

For an agent to send emails:
1. Go to **CRM / Лиды** and select the **Агенты** tab.
2. Locate the agent in the table.
3. In the **Алиас Email** column, type the alias (e.g., `ivan`) and click the checkmark ✓.
3. The agent will now send emails from `ivan@bizmuzik.ru`.
4. If no alias is set, the system will use a default address.

## 5. Verification

1. Send a test email from a lead card.
2. Reply to that email from a personal inbox.
3. Check if the reply appears in the lead's activity log within ~30 seconds.
