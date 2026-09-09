import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyAgentOfNewLead } from '@/lib/notify-agent';
import { checkRateLimit } from '@/lib/rate-limit';

// Replaces the old client-side (browser -> Supabase anon key) insert
// path for ContactForm/CashFlowCalculator, and the standalone
// /api/notify-new-lead route it fed. Both moved here so agent
// notification is triggered in-process, for a lead id the server
// itself just created -- not a public endpoint that accepts an
// arbitrary client-supplied id (see the pre-publication audit's
// notify-new-lead abuse-vector finding). contacts/leads no longer
// grant anon any access at all as a result (see the
// lock_down_contacts_leads_anon_access migration).

type ContactType = 'buyer' | 'seller' | 'investor' | 'past_client';
type ContactSource = 'public_record' | 'referral' | 'content' | 'ad';

type FormSource = 'contact' | 'calculator';

type LeadRequestBody = {
  name: string;
  email: string;
  phone?: string | null;
  source: ContactSource;
  contactType: ContactType;
  tags?: string[] | null;
  sourceDetail: string;
  calculatorInputs?: unknown;
  calculatorResults?: unknown;
  // Rate-limit bucket discriminator, not stored -- keeps the two forms
  // from sharing one ceiling, since a burst on one (e.g. an open house
  // full of visitors unlocking the calculator on shared wifi) shouldn't
  // eat the other's headroom, and they warrant different limits.
  formSource: FormSource;
};

const VALID_SOURCES = new Set<ContactSource>(['public_record', 'referral', 'content', 'ad']);
const VALID_CONTACT_TYPES = new Set<ContactType>(['buyer', 'seller', 'investor', 'past_client']);
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// Per-IP requests/hour. Every accepted request creates a real
// contact/lead row and triggers one Resend email + one Twilio SMS to
// Tyler, so this bounds real spend directly -- sized to stop a
// scripted loop, not to throttle a household or an open house sharing
// one IP (carrier-grade NAT, corporate wifi).
const RATE_LIMITS: Record<FormSource, number> = {
  contact: 15,
  calculator: 5,
};

function isValidBody(body: unknown): body is LeadRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === 'string' && b.name.trim().length > 0 &&
    typeof b.email === 'string' && EMAIL_PATTERN.test(b.email) &&
    typeof b.source === 'string' && VALID_SOURCES.has(b.source as ContactSource) &&
    typeof b.contactType === 'string' && VALID_CONTACT_TYPES.has(b.contactType as ContactType) &&
    typeof b.sourceDetail === 'string' && b.sourceDetail.trim().length > 0 &&
    (b.formSource === 'contact' || b.formSource === 'calculator')
  );
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const ip = clientIp(request);
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
