import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 flex flex-col gap-20">
      {/* Buyer / general residential */}
      <section id="buy">
        <h1 className="text-3xl font-bold mb-4">San Antonio Real Estate, Done Right</h1>
        <p className="text-gray-700 mb-8">
          [Your bio — licensed agent, background, what makes you different]
        </p>
        <ContactForm source="content" contactType="buyer" sourceDetail="landing-page" />
      </section>

      {/* Tenant-side leasing */}
      <section id="rent" className="border-t pt-16">
        <h2 className="text-2xl font-bold mb-4">Looking for a Rental in San Antonio?</h2>
        <p className="text-gray-700 mb-8">
          I help renters find houses and apartments across the San Antonio area.
          Tell me what you're looking for and I'll send you current listings that match.
        </p>
        <ContactForm
          source="content"
          contactType="buyer"
          sourceDetail="lease-tenant"
          tags={['lease']}
        />
      </section>

      {/* Landlord-side leasing */}
      <section id="list-rental" className="border-t pt-16">
        <h2 className="text-2xl font-bold mb-4">Have a Property to Rent Out?</h2>
        <p className="text-gray-700 mb-8">
          I help owners get their San Antonio rental listed and leased — real market
          data on pricing, a straightforward process, no guesswork.
        </p>
        <ContactForm
          source="content"
          contactType="seller"
          sourceDetail="lease-landlord"
          tags={['lease']}
        />
      </section>
    </main>
  );
}
