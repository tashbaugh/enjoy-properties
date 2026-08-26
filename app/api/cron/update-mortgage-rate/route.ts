import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Vercel Cron sends this bearer token automatically on scheduled
// invocations (see vercel.json) -- checking it stops the route from
// being hit publicly to force-refresh or spam the FRED API.
function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fredUrl = new URL('https://api.stlouisfed.org/fred/series/observations');
  fredUrl.searchParams.set('series_id', 'MORTGAGE30US');
  fredUrl.searchParams.set('api_key', process.env.FRED_API_KEY!);
  fredUrl.searchParams.set('file_type', 'json');
  fredUrl.searchParams.set('sort_order', 'desc');
  fredUrl.searchParams.set('limit', '1');

  let fredRes: Response;
  try {
    fredRes = await fetch(fredUrl);
  } catch (err) {
    console.error('FRED fetch threw:', err);
    return NextResponse.json({ error: 'FRED fetch threw', detail: String(err) }, { status: 502 });
  }
  if (!fredRes.ok) {
    const body = await fredRes.text();
    console.error('FRED non-ok response:', fredRes.status, body);
    return NextResponse.json(
      { error: 'FRED request failed', status: fredRes.status, body },
      { status: 502 }
    );
  }

  const fredData = await fredRes.json();
  const observation = fredData.observations?.[0];
  const rate = observation ? parseFloat(observation.value) : NaN;

  if (!observation || Number.isNaN(rate)) {
    return NextResponse.json({ error: 'No valid FRED observation' }, { status: 502 });
  }

  const { error } = await supabaseAdmin.from('site_config').upsert(
    {
      key: 'mortgage_rate_30yr',
      value: { rate, source: 'FRED MORTGAGE30US', as_of: observation.date },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rate, as_of: observation.date });
}
