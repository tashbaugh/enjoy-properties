import { ImageResponse } from 'next/og';
import { loadFraunces, loadInter } from '@/lib/og-font';
import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_ALT } from '@/lib/constants';

// Shared with lib/constants.ts's BASE_OPENGRAPH.images, which
// references this file by URL rather than through the file-convention
// auto-injection (see the comment there for why) -- these constants
// keep the two from drifting apart.
export const size = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
export const contentType = 'image/png';
export const alt = OG_IMAGE_ALT;

const TITLE = 'Enjoy Properties';
const TAGLINE = 'San Antonio Real Estate, Done Right';
const BROKERAGE_LINE_1 = 'Tyler Ashbaugh, REALTOR® · Texas Premier Realty, LLC';
const BROKERAGE_LINE_2 = 'TREC Lic. #833862-SA';
const BODY_TEXT = `${TAGLINE}${BROKERAGE_LINE_1}${BROKERAGE_LINE_2}`;

// Default OG image for every route that doesn't define its own more
// specific one (none currently do). Statically generated once at
// build time -- no per-request cost.
export default async function Image() {
  // Both fonts are required, not just the headline's -- this
  // environment has no generic system fallback, so any text without an
  // explicitly loaded, glyph-covering font renders via a thin internal
  // fallback that doesn't match either brand typeface (see lib/og-font.ts).
  const [fraunces, inter] = await Promise.all([loadFraunces(600, TITLE), loadInter(500, BODY_TEXT)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#101828',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Fraunces', fontSize: 76, color: '#faf8f5' }}>
          {TITLE}
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 32, color: '#b7893f' }}>
          {TAGLINE}
        </div>
        <div style={{ display: 'flex', marginTop: 64, width: 200, height: 2, background: '#b7893f' }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 32,
            fontSize: 24,
            color: 'rgba(250, 248, 245, 0.7)',
          }}
        >
          <div style={{ display: 'flex' }}>{BROKERAGE_LINE_1}</div>
          <div style={{ display: 'flex', marginTop: 6 }}>{BROKERAGE_LINE_2}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: fraunces, style: 'normal', weight: 600 },
        { name: 'Inter', data: inter, style: 'normal', weight: 500 },
      ],
    }
  );
}
