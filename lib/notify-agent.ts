import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { sendSms } from '@/lib/twilio';
import { escapeHtml } from '@/lib/html';
import { checkRateLimit } from '@/lib/rate-limit';

// SMS body stays near one segment even if a name is maxed out at the
// lead-validation limit (100 chars).
const MAX_SMS_NAME_LENGTH = 40;

// Global ceiling across all leads, on top of app/api/leads's per-IP
// limit -- rotating IPs bypasses the per-IP cap, and every accepted
// lead sends one SMS and one email, so an unbounded flood could burn
// Resend's free-tier quota and block real welcome emails. Current
// volume is far below these; tune if that changes.
const GLOBAL_SMS_LIMIT_PER_HOUR = 10;
const GLOBAL_EMAIL_LIMIT_PER_HOUR = 30;

function supabaseProjectRef(): string {
  const match = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return match?.[1] ?? '';
}

/**
 * Callers should not await this on the user-facing success path.
 * Takes a leadId, not a contactId -- notification is per lead, not per
 * contact, so a past client who inquires again about a different
 * property still gets a fresh alert instead of being silently
 * swallowed by a contact-level idempotency check. Both call sites
 * (app/api/leads, app/api/webhooks/boldtrail-lead) create the lead
 * server-side, so the id is always available here now.
 *
 * Idempotent per lead: the update below only succeeds (returns a row)
 * the first time it's called for a given lead id, since it's scoped to
 * `notified_at is null` and every subsequent call finds it already
 * set. Postgres re-evaluates the WHERE clause after acquiring the row
 * lock, so concurrent calls for the same id can't both win -- this is
 * what actually caps real sends to at most once per lead, not the
 * caller-side rate limit in app/api/leads.
 */
export async function notifyAgentOfNewLead(leadId: string): Promise<void> {
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', leadId)
    .is('notified_at', null)
    .select('contact_id, source_detail, raw_payload')
    .maybeSingle();

  if (!lead) {
    // Either no such lead, or it's already been notified -- no-op
    // either way, not an error worth logging.
    return;
  }

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('name, email, phone, source, contact_type')
    .eq('id', lead.contact_id)
    .maybeSingle();

  if (!contact) {
    console.error(`notify-new-lead: no contact found for lead ${leadId}`);
    return;
  }

  const rawPayload = lead.raw_payload as Record<string, unknown> | null | undefined;
  const boldTrailLink = typeof rawPayload?.lead_details_link === 'string' ? rawPayload.lead_details_link : null;
  const link = boldTrailLink ?? `https://supabase.com/dashboard/project/${supabaseProjectRef()}/editor`;

  // These fields come straight from the public form -- escape before
  // building HTML so a name/source_detail containing markup can't inject
  // links or scripts into an email Tyler reads from his own domain.
  const htmlLines = [
    `New lead: ${escapeHtml(contact.name)}`,
    `Source: ${escapeHtml(contact.source)}${lead.source_detail ? ` — ${escapeHtml(lead.source_detail)}` : ''}`,
    `Type: ${escapeHtml(contact.contact_type)}`,
    `Email: ${escapeHtml(contact.email)}`,
    contact.phone ? `Phone: ${escapeHtml(contact.phone)}` : null,
    `Link: ${escapeHtml(link)}`,
  ].filter((line): line is string => Boolean(line));

  // SMS is plain text (no markup risk), but still truncate the name so
  // an oversized one can't multiply the message into extra segments.
  const smsName = contact.name.length > MAX_SMS_NAME_LENGTH
    ? `${contact.name.slice(0, MAX_SMS_NAME_LENGTH - 1)}…`
    : contact.name;
  const smsLines = [
    `New lead: ${smsName}`,
    `Source: ${contact.source}${lead.source_detail ? ` — ${lead.source_detail}` : ''}`,
    `Type: ${contact.contact_type}`,
    `Email: ${contact.email}`,
    contact.phone ? `Phone: ${contact.phone}` : null,
    `Link: ${link}`,
  ].filter((line): line is string => Boolean(line));

  const agentPhone = process.env.AGENT_NOTIFICATION_PHONE;
  if (!agentPhone) {
    console.error('notify-agent: AGENT_NOTIFICATION_PHONE is unset, skipping SMS notification');
  }

  const emailOk = await checkRateLimit('notify:email:global', GLOBAL_EMAIL_LIMIT_PER_HOUR, 3600);
  // No point spending a slot in the SMS bucket when there's no phone to
  // send to anyway -- that's a config issue, not a cap.
  const smsOk = agentPhone ? await checkRateLimit('notify:sms:global', GLOBAL_SMS_LIMIT_PER_HOUR, 3600) : true;

  if (!emailOk || (agentPhone && !smsOk)) {
    console.warn('notify-agent: global cap hit, deferring to daily digest', { leadId });
    await supabaseAdmin.from('leads').update({ next_follow_up_at: new Date().toISOString() }).eq('id', leadId);
  }

  const channels: ('email' | 'sms')[] = [];
  const sendPromises: Promise<unknown>[] = [];
  if (emailOk) {
    channels.push('email');
    sendPromises.push(
      sendEmail({
        to: process.env.AGENT_NOTIFICATION_EMAIL!,
        subject: `New lead: ${contact.name}`,
        html: htmlLines.join('<br>'),
      })
    );
  }
  if (agentPhone && smsOk) {
    channels.push('sms');
    sendPromises.push(sendSms({ to: agentPhone, body: smsLines.join('\n') }));
  }

  const results = await Promise.allSettled(sendPromises);
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`notify-new-lead: ${channels[i]} failed`, result.reason);
    }
  });
}
