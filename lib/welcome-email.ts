import { IABS_URL } from '@/lib/constants';
import { buildUnsubscribeToken } from '@/lib/unsubscribe-token';

// Fixed skeleton per docs/phase3-automation-spec.md §2.3 -- the IABS
// line, physical address, and unsubscribe link are CAN-SPAM/TREC
// requirements, not stylistic choices. Only searchContextSentence is
// ever model-generated (see lib/claude-welcome-message.ts); everything
// else here is static.
export function buildWelcomeEmailHtml(params: {
  firstName: string;
  contactId: string;
  searchContextSentence: string;
}): string {
  const unsubscribeUrl = `https://www.enjoyproperties.us/api/unsubscribe?token=${buildUnsubscribeToken(params.contactId)}`;
  const address = process.env.BROKERAGE_PHYSICAL_ADDRESS;

  return `
    <p>Hi ${escapeHtml(params.firstName)},</p>
    <p>Thanks for searching homes on my site! I'm Tyler Ashbaugh, a San Antonio REALTOR&reg; with
    Texas Premier Realty &mdash; I've also spent 22 years as a software engineer, work I still do
    alongside real estate, which comes in handy when it's time to dig into the numbers on a
    property.</p>
    <p>${escapeHtml(params.searchContextSentence)}</p>
    <p>I'll keep an eye on new listings that match what you're looking for, and I'm happy to
    answer any questions any time &mdash; just reply to this email or give me a call.</p>
    <p>Information About Brokerage Services: <a href="${IABS_URL}">${IABS_URL}</a></p>
    <p>Talk soon,<br>
    Tyler Ashbaugh, REALTOR&reg;<br>
    Texas Premier Realty, LLC<br>
    TREC Lic. #833862-SA<br>
    (210) 419-2016</p>
    <hr>
    <p style="font-size: 12px; color: #666;">
      ${address ? escapeHtml(address) + '<br>' : ''}
      Don't want these emails? <a href="${unsubscribeUrl}">Unsubscribe</a>
    </p>
  `;
}

export function subjectFor(firstName: string): string {
  return `Welcome, ${firstName} — let's find your next home in San Antonio`;
}

function escapeHtml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&#39;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
