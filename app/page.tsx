import Image from 'next/image';
import ContactForm from '@/components/ContactForm';

const TRUST_POINTS = [
  '20+ years of analytical, technical problem-solving — now applied to real estate',
  'Residential buyers, sellers & renters — San Antonio & surrounding areas',
  'Licensed Texas REALTOR® — TREC Lic. #833862-SA, held to the REALTOR® Code of Ethics',
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Buyer / general residential */}
      <section id="buy" className="scroll-mt-20 bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/tyler-headshot.jpg"
                alt="Tyler Ashbaugh"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div>
                <p className="text-sm font-semibold text-ink">Tyler Ashbaugh</p>
                <p className="text-xs text-ink-soft">REALTOR® · Texas Premier Realty</p>
              </div>
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              San Antonio Real Estate, Done Right
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              I&apos;m Tyler Ashbaugh, a licensed Texas REALTOR® with Texas Premier Realty.
              I&apos;ve also spent 20+ years as a software engineer — work I still do alongside
              real estate — and I bring that same analytical, no-nonsense approach to helping
              you buy, sell, or lease in San Antonio. No pressure, no fluff, just clear numbers
              and honest guidance.
            </p>
            <ul className="mt-8 space-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-ink-soft">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Get in touch</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tell me what you&apos;re looking for and I&apos;ll follow up shortly.
            </p>
            <div className="mt-6">
              <ContactForm source="content" contactType="buyer" sourceDetail="landing-page" />
            </div>
          </div>
        </div>
      </section>

      {/* Tenant-side leasing */}
      <section id="rent" className="scroll-mt-20 border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div className="order-2 rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-8 md:order-1">
            <h2 className="font-display text-xl font-semibold text-ink">Find a rental</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tell me what you&apos;re looking for and I&apos;ll send matching listings.
            </p>
            <div className="mt-6">
              <ContactForm
                source="content"
                contactType="buyer"
                sourceDetail="lease-tenant"
                tags={['lease']}
              />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Looking for a Rental in San Antonio?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              I help renters find houses and apartments across the San Antonio area. Tell me
              what you&apos;re looking for and I&apos;ll send you current listings that match.
            </p>
          </div>
        </div>
      </section>

      {/* Landlord-side leasing */}
      <section id="list-rental" className="scroll-mt-20 border-t border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Have a Property to Rent Out?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              I help owners get their San Antonio rental listed and leased — real market data
              on pricing, a straightforward process, no guesswork.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">List your rental</h2>
            <p className="mt-1 text-sm text-ink-soft">
              A few details and I&apos;ll be in touch to talk pricing and process.
            </p>
            <div className="mt-6">
              <ContactForm
                source="content"
                contactType="seller"
                sourceDetail="lease-landlord"
                tags={['lease']}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
