import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Public read-only endpoint. site_config has no anon policy at all, so
// this route (using the service-role key server-side) is the only way
// the client ever sees a value from it -- and only this one field.
export async function GET() {
  const { data } = await supabaseAdmin
    .from('site_config')
    .select('value')
    .eq('key', 'mortgage_rate_30yr')
    .maybeSingle();

  const rate = data?.value?.rate;
  if (typeof rate !== 'number') {
    return NextResponse.json({ rate: null }, { status: 200 });
  }

  return NextResponse.json({ rate });
}
