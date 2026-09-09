import { ImageResponse } from 'next/og';
import { loadFraunces } from '@/lib/og-font';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// "E" monogram, same ink/gold pairing as the OG image, so the browser
// tab/home-screen icon and the link-preview card read as one system.
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
        <div style={{ display: 'flex', fontFamily: 'Fraunces', fontSize: 108, color: '#b7893f' }}>
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
