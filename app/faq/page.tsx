import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';
import { BASE_OPENGRAPH, BASE_TWITTER } from '@/lib/constants';

const SOCIAL_TITLE = 'San Antonio Real Estate FAQ';
const SOCIAL_DESCRIPTION =
  'Common questions about buying, selling, renting, and investing in San Antonio real estate with Tyler Ashbaugh.';

// openGraph/twitter spread the shared bases -- see the note in
// app/page.tsx on why (Next's metadata merging is shallow per nested
// object, so a bare {title, description} override here would silently
// drop og:site_name/type/locale and twitter:card).
export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers to common questions about working with Tyler Ashbaugh, REALTOR® with Texas Premier Realty, on buying, selling, renting, or investing in San Antonio.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    ...BASE_OPENGRAPH,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    url: '/faq',
  },
  twitter: {
    ...BASE_TWITTER,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
};

// Single source of truth for both the visible page content and the
// FAQPage JSON-LD below -- Google's structured-data guidelines require
// the two to match, so this array is read by both rather than keeping
// separate copies that could drift.
//
// Deliberately no specific cost percentages or cap-rate numbers here --
// those go stale and read as financial guidance rather than a durable
// FAQ answer. Points to the calculator or a direct conversation instead.
const FAQ_ITEMS = [
  {
    question: 'Who is Tyler Ashbaugh?',
    answer:
      "I'm a licensed Texas REALTOR® with Texas Premier Realty, LLC (TREC Lic. #833862-SA), serving San Antonio and the surrounding area. I've also spent 22 years as a software engineer -- work I still do alongside real estate -- and I bring that same analytical approach to helping clients buy, sell, rent, or invest.",
  },
  {
    question: 'What areas does Tyler Ashbaugh serve?',
    answer: 'San Antonio, TX and the surrounding area.',
  },
  {
    question: 'Does Tyler work with buyers, sellers, renters, and investors?',
    answer:
      'Yes. I work with residential buyers and sellers, tenants and landlords on the leasing side, and real estate investors looking at cash flow and cap rate.',
  },
  {
    question: "What's a good cap rate for a San Antonio rental property?",
    answer:
      "It depends on the specific property, neighborhood, and your financing -- there isn't one number that applies across the board. The free cash flow calculator on the Invest page lets you plug in real numbers for a specific property and see its actual cap rate and monthly cash flow.",
  },
  {
    question: 'How does the investment property cash flow calculator work?',
    answer:
      "Enter a property's price, rent, taxes, insurance, and financing assumptions, and it shows cap rate and monthly cash flow immediately -- no email required. It starts from a live 30-year mortgage rate so the numbers reflect current financing, not a stale default. Enter your name and email to unlock the full breakdown: cash-on-cash return, a monthly expense breakdown, and a 5-year equity projection.",
  },
  {
    question: 'What does it cost to sell a house in San Antonio?',
    answer:
      "Selling costs vary by situation -- price point, condition, financing payoff, and more all factor in. Rather than quote a generic percentage that may not apply to your home, I'd rather walk through your specific numbers with you directly.",
  },
  {
    question: 'Is Tyler Ashbaugh a licensed REALTOR®?',
    answer:
      'Yes -- TREC Lic. #833862-SA, affiliated with Texas Premier Realty, LLC, and held to the REALTOR® Code of Ethics.',
  },
  {
    question: 'Will I get texted automatically if I fill out a form?',
    answer:
      "No. Filling out a form alone does not sign you up for text messages. If you provide a phone number, you may receive a one-time opt-in request -- texts only continue if you reply YES to that message. You can reply STOP at any time to opt out.",
  },
  {
    question: 'How do I get started?',
    answer: "Reach out through the contact form or call (210) 419-2016, and I'll follow up shortly.",
  },
];

export default function Faq() {
  return (
    <main className="bg-paper">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Common questions about buying, selling, renting, and investing in San Antonio real
          estate. Don&apos;t see your question here?{' '}
          <Link href="/contact" className="underline hover:text-gold">
            Get in touch
          </Link>
          .
        </p>
        <dl className="mt-12 space-y-10">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-display text-xl font-semibold text-ink">{item.question}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
