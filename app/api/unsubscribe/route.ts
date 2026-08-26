import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';

function page(message: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head>
    <body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem;">
      <p>${message}</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const contactId = token ? verifyUnsubscribeToken(token) : null;

  if (!contactId) {
    return page('This unsubscribe link is invalid or has expired.');
  }

  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ email_opted_out: true })
    .eq('id', contactId);

  if (error) {
    return page('Something went wrong processing your request. Please contact us directly to unsubscribe.');
  }

  return page("You've been unsubscribed and won't receive further emails from this address.");
}
