import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { sendSms } from '@/lib/twilio';
import { draftWelcomeMessageSlots } from '@/lib/claude-welcome-message';
import { buildWelcomeEmailHtml, subjectFor } from '@/lib/welcome-email';

// Contract for Zapier's Action-step field mapping. The BoldTrail trigger
// fields observed (docs/handoff-boldtrail-webhook.md) use human-readable
// labels Zapier assigns, not stable JSON keys -- rather than guess at
// Zapier's internal naming, this route defines the keys and Zapier's
// Action step maps BoldTrail's fields onto them.
type BoldTrailPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isSeller?: string | boolean; // "Yes"/"No" as sent by Zapier, or a real boolean
  leadId?: string | number;
  leadStatus?: string;
  quality?: string | number;
  hashtags?: string;
  createdAt?: string;
  sourceUrl?: string;
  howAddedToDatabase?: string;
  onDrip?: string | boolean;
  leadDetailsLink?: string;
  assignedAgentEmail?: string;
  assignedAgentName?: string;
  emailStatus?: string;
  hasLender?: string | boolean;
  leadCity?: string;
  leadState?: string;
  leadZip?: string;
  street?: string;
  sellerStreet?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerZip?: string;
  sellerFullAddress?: string;
};

const STAGE_MAP: Record<string, string> = {
  Contract: 'under_contract',
};

const ASSIGNED_AGENT_EMAIL = 'tyler@enjoyproperties.us';

function isAffirmative(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return (value ?? '').trim().toLowerCase() === 'yes';
}

function parseQuality(value: string | number | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : null;
}

function parseHashtags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

/** A BoldTrail Leadid of missing/empty/0 is a known test-record artifact
 * (docs/handoff-boldtrail-webhook.md) -- never trust it as a real
 * idempotency key. */
function validLeadId(value: string | number | undefined): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s && s !== '0' ? s : null;
}

export async function POST(request: NextRequest) {
  if (!process.env.BOLDTRAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  if (request.headers.get('x-webhook-secret') !== process.env.BOLDTRAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: BoldTrailPayload = await request.json();

  if (!payload.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  if (payload.assignedAgentEmail && payload.assignedAgentEmail !== ASSIGNED_AGENT_EMAIL) {
    console.warn(
      `boldtrail-lead: assigned agent is "${payload.assignedAgentEmail}", expected "${ASSIGNED_AGENT_EMAIL}" -- lead may be routed unexpectedly`
    );
  }

  // Idempotency -- see validLeadId() above for why an invalid id skips
  // dedup entirely rather than risk a false-positive match that would
  // silently drop a real lead.
  const externalId = validLeadId(payload.leadId);
  if (!externalId) {
    console.warn('boldtrail-lead: missing/invalid Leadid, proceeding without idempotency check', {
      email: payload.email,
    });
  } else {
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('external_source', 'boldtrail')
      .eq('external_id', externalId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: 'already processed' }, { status: 200 });
    }
  }

  const firstName = (payload.firstName ?? '').trim();
  const lastName = (payload.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim() || 'BoldTrail Lead';
  const contactType = isAffirmative(payload.isSeller) ? 'seller' : 'buyer';
  const hashtags = parseHashtags(payload.hashtags);

  // Look up by email rather than blind-insert -- reuses an existing
  // contact (e.g. from the site's own ContactForm) instead of
  // duplicating them, and never overwrites name/phone they entered
  // themselves elsewhere. Only the tag list gets merged.
  const { data: existingContact } = await supabaseAdmin
    .from('contacts')
    .select('id, tags, email_opted_out, sms_opted_out')
    .eq('email', payload.email)
    .maybeSingle();

  let contactId: string;
  let emailOptedOut = false;
  let smsOptedOut = false;

  if (existingContact) {
    contactId = existingContact.id;
    emailOptedOut = existingContact.email_opted_out;
    smsOptedOut = existingContact.sms_opted_out;
    const mergedTags = Array.from(new Set([...(existingContact.tags ?? []), ...hashtags, 'boldtrail']));
    await supabaseAdmin.from('contacts').update({ tags: mergedTags }).eq('id', contactId);
  } else {
    const { data: newContact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        name,
        email: payload.email,
        phone: payload.phone || null,
        source: 'boldtrail',
        contact_type: contactType,
        tags: [...hashtags, 'boldtrail'],
      })
      .select('id')
      .single();

    if (contactError || !newContact) {
      return NextResponse.json({ error: contactError?.message ?? 'Insert failed' }, { status: 500 });
    }
    contactId = newContact.id;
  }

  const stage = payload.leadStatus ? (STAGE_MAP[payload.leadStatus] ?? 'new') : 'new';

  const { error: leadError } = await supabaseAdmin.from('leads').insert({
    contact_id: contactId,
    stage,
    score: parseQuality(payload.quality),
    source_detail: 'boldtrail-zapier',
    external_source: 'boldtrail',
    external_id: externalId,
    next_follow_up_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    raw_payload: payload,
  });

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  // Search context: BoldTrail's payload has no structured price/area/
  // bedroom fields (hashtags aren't semantically parsed yet, per the
  // handoff) -- this always resolves to the deterministic fallback
  // sentence, no Claude call, until that changes.
  const { search_context_sentence } = await draftWelcomeMessageSlots({ firstName: firstName || 'there' });

  const sendResults = await Promise.allSettled([
    (async () => {
      if (emailOptedOut) return;
      if (!process.env.BROKERAGE_PHYSICAL_ADDRESS) {
        console.error('boldtrail-lead: BROKERAGE_PHYSICAL_ADDRESS not set, skipping welcome email (CAN-SPAM requires it)');
        return;
      }
      await sendEmail({
        to: payload.email!,
        subject: subjectFor(firstName || 'there'),
        html: buildWelcomeEmailHtml({
          firstName: firstName || 'there',
          contactId,
          searchContextSentence: search_context_sentence,
        }),
      });
      await supabaseAdmin.from('interactions').insert({
        contact_id: contactId,
        channel: 'email',
        direction: 'outbound',
        content: subjectFor(firstName || 'there'),
        ai_generated: true,
      });
    })(),
    (async () => {
      if (!payload.phone || smsOptedOut) return;
      // Double opt-in request, NOT the welcome-skeleton SMS -- per spec
      // §2.4, BoldTrail's own consent checkbox is treated as
      // insufficient for a Twilio send under Tyler's own identity.
      // sms_consent stays false until an affirmative reply flips it
      // (app/api/webhooks/twilio-inbound).
      const body = `Hi ${firstName || 'there'}, it's Tyler Ashbaugh with Texas Premier Realty. Reply YES to get home search texts and updates. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out.`;
      await sendSms({ to: payload.phone, body });
      await supabaseAdmin.from('interactions').insert({
        contact_id: contactId,
        channel: 'sms',
        direction: 'outbound',
        content: body,
        ai_generated: false,
      });
    })(),
  ]);

  sendResults.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`boldtrail-lead: ${i === 0 ? 'email' : 'sms'} send failed`, result.reason);
    }
  });

  return NextResponse.json({ status: 'ok', contactId }, { status: 201 });
}
