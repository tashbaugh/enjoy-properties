import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { websiteJsonLd } from '@/lib/structured-data';
import { SITE_URL, SITE_NAME, BASE_OPENGRAPH, BASE_TWITTER } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

const SITE_DESCRIPTION =
  'Buy, sell, rent, or invest in San Antonio real estate with Tyler Ashbaugh, REALTOR® with Texas Premier Realty — real market data, no hype.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} | San Antonio Real Estate with Tyler Ashbaugh`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    ...BASE_OPENGRAPH,
    url: SITE_URL,
    title: `${SITE_NAME} | San Antonio Real Estate with Tyler Ashbaugh`,
    description: SITE_DESCRIPTION,
    // BASE_OPENGRAPH.images points at /opengraph-image explicitly --
    // see the comment there. It does NOT duplicate the tag Next would
    // auto-inject for this exact route (confirmed by rendering actual
    // output): the file convention only auto-attaches when nothing in
    // the resolved metadata already specifies `images`, so declaring it
    // here replaces rather than adds to that auto-injection.
  },
  twitter: {
    ...BASE_TWITTER,
    title: `${SITE_NAME} | San Antonio Real Estate with Tyler Ashbaugh`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Google Ads (gtag.js) — omitted entirely until NEXT_PUBLIC_GOOGLE_ADS_ID is set */}
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel — omitted entirely until NEXT_PUBLIC_META_PIXEL_ID is set */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body>
        {/* Site-wide, not homepage-only -- describes the site itself as
        an entity, same on every route. RealEstateAgent (the person/
        business) lives on the homepage instead, in app/page.tsx. */}
        <JsonLd data={websiteJsonLd()} />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
