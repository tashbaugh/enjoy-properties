import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import CashFlowCalculator from '@/components/CashFlowCalculator';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/structured-data';
import { BASE_OPENGRAPH, BASE_TWITTER } from '@/lib/constants';

const SOCIAL_TITLE = 'San Antonio Investment Property Calculator';
const SOCIAL_DESCRIPTION =
  'Cash flow and cap rate, not just curb appeal — run the numbers on a San Antonio investment property in seconds.';

// Also covers the cash-flow calculator -- it's embedded on this page
// (CashFlowCalculator below), not a separate /calculator route.
//
// openGraph/twitter spread the shared bases -- see the note in
// app/page.tsx on why (Next's metadata merging is shallow per nested
// object, so a bare {title, description} override here would silently
// drop og:site_name/type/locale and twitter:card).
export const metadata: Metadata = {
  title: 'Investment Property Cash Flow Calculator',
  description:
    'Run real cap rate and cash flow numbers on San Antonio investment properties — free calculator, honest projections, from a REALTOR® with 22 years of engineering background.',
  alternates: {
    canonical: '/invest',
  },
  openGraph: {
    ...BASE_OPENGRAPH,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    url: '/invest',
  },
  twitter: {
    ...BASE_TWITTER,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
};

export default function Invest() {
  return (
    <main className="bg-paper">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Invest', path: '/invest' },
        ])}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            San Antonio Investment Properties
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Cash flow and cap rate, not just curb appeal. I evaluate every investment property
            with the same rigor I&apos;d bring to any engineering problem — real numbers, honest
            projections, no hype. This page (and the tools on it) reflect that approach.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink">Get in touch</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tell me about your investment goals and I&apos;ll follow up shortly.
          </p>
          <div className="mt-6">
            <ContactForm source="content" contactType="investor" sourceDetail="invest-page" />
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <CashFlowCalculator />
        </div>
      </div>
    </main>
  );
}
