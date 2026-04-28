export const BIZMUZIK_DOMAIN = 'bizmuzik.ru';
export const INBOUND_DOMAIN = 'mg.bizmuzik.ru'; // Use subdomain for inbound as per setup guide

export function getAgentFromAddress(
  agentAlias: string, 
  agentFirstName: string
): string {
  // Requirement: FROM: [AgentName] из BizMuzik <anna@bizmuzik.ru>
  return `${agentFirstName} из BizMuzik <${agentAlias}@${BIZMUZIK_DOMAIN}>`;
}

export function getReplyToAddress(leadId: string): string {
  // Requirement: reply+[lead_id]@bizmuzik.ru
  // Note: Setup guide says mg.bizmuzik.ru for inbound, but from address is @bizmuzik.ru.
  // We'll use @mg.bizmuzik.ru for the reply-to to ensure it hits Mailgun routes.
  return `reply+${leadId}@${INBOUND_DOMAIN}`;
}

export function extractLeadIdFromEmail(toAddress: string): string | null {
  // Match reply+([a-zA-Z0-9-]+)@mg.bizmuzik.ru or @bizmuzik.ru
  const match = toAddress.match(/reply\+([a-zA-Z0-9-]+)@(?:mg\.)?bizmuzik\.ru/);
  return match ? match[1] : null;
}

export function cleanEmailBody(rawText: string): string {
  return rawText
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .filter(line => {
      const trimmed = line.trim();
      // Remove common "On ... wrote:" or "В ... пользователь ... написал:"
      return !trimmed.match(/^On .* wrote:$/) && !trimmed.match(/^В .* пользователь .* написал:$/);
    })
    .join('\n')
    .trim()
    .substring(0, 2000);
}

export function getNicheFromBusinessNiche(nicheName: string): 
  'salon' | 'retail' | 'auto' | 'cafe' | 'default' {
  if (!nicheName) return 'default';
  const n = nicheName.toLowerCase();
  if (n.includes('салон') || n.includes('красот') || n.includes('beauty')) return 'salon';
  if (n.includes('магаз') || n.includes('ритейл') || n.includes('shop') || n.includes('retail')) return 'retail';
  if (n.includes('авто') || n.includes('car')) return 'auto';
  if (n.includes('кафе') || n.includes('ресторан') || 
      n.includes('бар') || n.includes('кофе') || n.includes('cafe') || n.includes('rest')) return 'cafe';
  return 'default';
}
