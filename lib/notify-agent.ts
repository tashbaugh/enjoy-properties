import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { sendSms } from '@/lib/twilio';

// Tyler's personal cell -- the notification *destination*, distinct
// from TWILIO_FROM_NUMBER (the sending number for every outbound
// message, to leads and now to this notification too).
const AGENT_CELL = '+12104192016';

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

  const lines = [
    `New lead: ${contact.name}`,
    `Source: ${contact.source}${lead.source_detail ? ` — ${lead.source_detail}` : ''}`,
    `Type: ${contact.contact_type}`,
    `Email: ${contact.email}`,
    contact.phone ? `Phone: ${contact.phone}` : null,
    `Link: ${link}`,
  ].filter((line): line is string => Boolean(line));

  const results = await Promise.allSettled([
    sendEmail({
      to: process.env.AGENT_NOTIFICATION_EMAIL!,
      subject: `New lead: ${contact.name}`,
      html: lines.join('<br>'),
    }),
    sendSms({ to: AGENT_CELL, body: lines.join('\n') }),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`notify-new-lead: ${i === 0 ? 'email' : 'sms'} failed`, result.reason);
    }
  });
}
