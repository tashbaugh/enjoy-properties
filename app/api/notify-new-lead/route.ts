import { NextRequest, NextResponse } from 'next/server';
import { notifyAgentOfNewLead } from '@/lib/notify-agent';

// Deliberately unauthenticated -- called from the browser right after a
// public ContactForm/calculator insert, so there's no secret it could
// hold anyway. Worst-case abuse is a duplicate notification for a real
// existing contact id (not discovery of new data, not a write) -- the
// same trust posture as the public anon-insert endpoints this site
// already exposes.
export async function POST(request: NextRequest) {
  const { contactId } = await request.json();

  if (!contactId) {
    return NextResponse.json({ error: 'Missing contactId' }, { status: 400 });
  }

  try {
    await notifyAgentOfNewLead(contactId);
  } catch (err) {
    console.error('notify-new-lead: failed', err);
  }

  return NextResponse.json({ status: 'ok' });
}
