import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizePhone } from '@/lib/phone';

// Twilio's own request signature is the security boundary here (not a
// shared secret, unlike the BoldTrail webhook) -- Twilio signs every
// request it sends, so there's a stronger mechanism available than for
// Zapier, which doesn't sign its webhook calls.
const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
// Deliberately excludes "YES" -- that's this project's custom SMS
// double-opt-in confirmation keyword (spec §2.4), handled separately
// below. NOTE: "YES" is also one of Twilio's own default Advanced
// Opt-Out resubscribe keywords -- worth confirming directly against
// Twilio's docs/support that this doesn't collide before relying on it
// for a number that's ever had Advanced Opt-Out's STOP state on it.
const START_KEYWORDS = new Set(['START', 'UNSTOP']);
const CONSENT_KEYWORDS = new Set(['YES', 'Y']);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const signature = request.headers.get('x-twilio-signature') ?? '';

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    request.url,
    Object.fromEntries(params)
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const from = params.get('From') ?? '';
  const body = (params.get('Body') ?? '').trim().toUpperCase();
  const normalizedFrom = normalizePhone(from);

  if (!normalizedFrom) {
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Low current volume -- fetch and match in JS rather than a DB-side
  // digit-stripping match, matching the pragmatic scale assumptions
  // already used elsewhere in this project.
  const { data: contacts } = await supabaseAdmin.from('contacts').select('id, phone').not('phone', 'is', null);
  const contact = contacts?.find((c) => normalizePhone(c.phone) === normalizedFrom);

  if (!contact) {
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  let replyText: string | null = null;

  if (STOP_KEYWORDS.has(body)) {
    await supabaseAdmin.from('contacts').update({ sms_opted_out: true }).eq('id', contact.id);
    // No reply here -- Twilio's Advanced Opt-Out sends its own STOP
    // confirmation at the carrier level; replying here too would
    // double-message the contact.
  } else if (START_KEYWORDS.has(body)) {
    await supabaseAdmin.from('contacts').update({ sms_opted_out: false }).eq('id', contact.id);
  } else if (CONSENT_KEYWORDS.has(body)) {
    await supabaseAdmin.from('contacts').update({ sms_consent: true }).eq('id', contact.id);
    replyText = "You're all set -- I'll text you when I find homes that match what you're looking for. Reply STOP anytime to opt out.";
  } else if (body === 'HELP') {
    replyText = 'Tyler Ashbaugh, Texas Premier Realty. Msg & data rates may apply. Reply STOP to opt out. Call (210) 419-2016 for help.';
  }

  const twiml = replyText
    ? `<Response><Message>${escapeXml(replyText)}</Message></Response>`
    : '<Response></Response>';

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
