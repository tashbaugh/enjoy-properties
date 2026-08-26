import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: dueLeads, error } = await supabaseAdmin
    .from('leads')
    .select('id, stage, created_at, next_follow_up_at, contacts(name, email, phone)')
    .lte('next_follow_up_at', new Date().toISOString())
    .not('stage', 'in', '(closed,lost)');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dueLeads || dueLeads.length === 0) {
    return NextResponse.json({ reminded: 0 });
  }

  const rows = dueLeads
    .map((lead) => {
      const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts;
      return `<tr>
        <td>${contact?.name ?? 'Unknown'}</td>
        <td>${contact?.email ?? ''}</td>
        <td>${contact?.phone ?? ''}</td>
        <td>${lead.stage}</td>
        <td>${daysSince(lead.created_at)} days</td>
      </tr>`;
    })
    .join('');

  const html = `
    <p>${dueLeads.length} lead${dueLeads.length === 1 ? '' : 's'} due for follow-up:</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Stage</th><th>Age</th></tr>
      ${rows}
    </table>
  `;

  try {
    await sendEmail({
      to: process.env.AGENT_NOTIFICATION_EMAIL!,
      subject: `${dueLeads.length} lead${dueLeads.length === 1 ? '' : 's'} due for follow-up`,
      html,
    });
  } catch (err) {
    // Deliberately don't clear next_follow_up_at below when the send
    // itself failed -- these leads stay "due" and retry tomorrow rather
    // than silently vanishing from the reminder queue on a Resend outage.
    console.error('follow-up-reminders: send failed, leads remain due', err);
    return NextResponse.json({ error: 'Send failed', detail: String(err) }, { status: 502 });
  }

  // Don't auto-reschedule -- stops the same stale lead from re-notifying
  // every day. The next reminder only fires once a new next_follow_up_at
  // is set manually after a real interaction is logged.
  await supabaseAdmin
    .from('leads')
    .update({ next_follow_up_at: null })
    .in('id', dueLeads.map((l) => l.id));

  return NextResponse.json({ reminded: dueLeads.length });
}
