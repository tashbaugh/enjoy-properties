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
 * Convenience layer, not critical path -- callers should not await this
 * on the user-facing success path. Only takes contactId (not leadId)
 * because neither client-side insert path can read a lead id back
 * (anon has insert-only RLS on `leads`); this looks up the contact's
 * most recent lead itself via the service-role client, which isn't
 * RLS-restricted.
 */
export async function notifyAgentOfNewLead(contactId: string): Promise<void> {
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('name, email, phone, source, contact_type')
    .eq('id', contactId)
    .single();

  if (!contact) {
    console.error(`notify-new-lead: no contact found for id ${contactId}`);
    return;
  }

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('source_detail, raw_payload')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawPayload = lead?.raw_payload as Record<string, unknown> | null | undefined;
  const boldTrailLink = typeof rawPayload?.lead_details_link === 'string' ? rawPayload.lead_details_link : null;
  const link = boldTrailLink ?? `https://supabase.com/dashboard/project/${supabaseProjectRef()}/editor`;

  const lines = [
    `New lead: ${contact.name}`,
    `Source: ${contact.source}${lead?.source_detail ? ` — ${lead.source_detail}` : ''}`,
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
