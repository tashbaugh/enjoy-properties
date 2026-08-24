import ContactForm from '@/components/ContactForm';

export default function Invest() {
  return (
    <main className="bg-paper">
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
    </main>
  );
}
