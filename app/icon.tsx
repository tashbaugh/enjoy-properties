import { ImageResponse } from 'next/og';
import { loadFraunces } from '@/lib/og-font';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Same "E" monogram as apple-icon.tsx -- modern browsers prefer this
// generated <link rel="icon"> over the static app/favicon.ico (a
// generic placeholder unrelated to this brand; see the audit notes).
export default async function Icon() {
  const fraunces = await loadFraunces(600, 'E');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#101828',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Fraunces', fontSize: 20, color: '#b7893f' }}>
          E
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Fraunces', data: fraunces, style: 'normal', weight: 600 }],
    }
  );
}
