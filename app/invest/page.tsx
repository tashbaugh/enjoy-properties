import ContactForm from '@/components/ContactForm';

export default function Invest() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">San Antonio Investment Properties</h1>
      <p className="text-gray-700 mb-8">
        [Cash flow / cap rate framing — real numbers, not sales pitch]
      </p>
      <ContactForm source="content" contactType="investor" sourceDetail="invest-page" />
    </main>
  );
}
