import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyAgentOfNewLead } from '@/lib/notify-agent';
import { checkRateLimit } from '@/lib/rate-limit';
import { LeadRequestSchema, type LeadRequestBody } from '@/lib/lead-validation';
import { verifyTurnstileToken } from '@/lib/turnstile';

// Reject before JSON.parse even looks at the body -- a few hundred bytes
// of real form data vs. an attacker sending megabytes to burn CPU/memory
// parsing something that's about to fail validation anyway.
const MAX_BODY_BYTES = 32 * 1024;

// Replaces the old client-side (browser -> Supabase anon key) insert
// path for ContactForm/CashFlowCalculator, and the standalone
// /api/notify-new-lead route it fed. Both moved here so agent
// notification is triggered in-process, for a lead id the server
// itself just created -- not a public endpoint that accepts an
// arbitrary client-supplied id (see the pre-publication audit's
// notify-new-lead abuse-vector finding). contacts/leads no longer
// grant anon any access at all as a result (see the
// lock_down_contacts_leads_anon_access migration).

// Rate-limit bucket discriminator, not stored -- keeps the two forms
// from sharing one ceiling, since a burst on one (e.g. an open house
// full of visitors unlocking the calculator on shared wifi) shouldn't
// eat the other's headroom, and they warrant different limits.
//
// Per-IP requests/hour. Every accepted request creates a real
// contact/lead row and triggers one Resend email + one Twilio SMS to
// Tyler, so this bounds real spend directly -- sized to stop a
// scripted loop, not to throttle a household or an open house sharing
// one IP (carrier-grade NAT, corporate wifi).
const RATE_LIMITS: Record<LeadRequestBody['formSource'], number> = {
  contact: 15,
  calculator: 5,
};

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = LeadRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const body = parsed.data;
  const ip = clientIp(request);

  const turnstileResult = await verifyTurnstileToken(body.turnstileToken, ip);
  if (!turnstileResult.ok) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: turnstileResult.status });
  }

  const allowed = await checkRateLimit(`leads:${body.formSource}:${ip}`, RATE_LIMITS[body.formSource], 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { data: contact, error: contactError } = await supabaseAdmin
    .from('contacts')
    .insert({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      source: body.source,
      contact_type: body.contactType,
      tags: body.tags ?? null,
    })
    .select('id')
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .insert({
      contact_id: contact.id,
      stage: 'new',
      source_detail: body.sourceDetail,
      calculator_inputs: body.calculatorInputs ?? null,
      calculator_results: body.calculatorResults ?? null,
    })
    .select('id')
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  try {
    await notifyAgentOfNewLead(lead.id);
  } catch (err) {
    console.error('leads: agent notification failed', err);
  }

  return NextResponse.json({ contactId: contact.id }, { status: 201 });
}
