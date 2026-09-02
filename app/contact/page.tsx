import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | Enjoy Properties',
  description: 'Get in touch with Tyler Ashbaugh, REALTOR® with Texas Premier Realty, about buying, renting, or listing a rental in San Antonio.',
};

export default function Contact() {
  return (
    <main className="bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Whether you&apos;re buying, renting, or looking to list a rental in San Antonio,
            tell me a bit about what you&apos;re looking for and I&apos;ll follow up shortly.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink">Get in touch</h2>
          <p className="mt-1 text-sm text-ink-soft">
            A few details and I&apos;ll be in touch to talk next steps.
          </p>
          <div className="mt-6">
            <ContactForm
              source="content"
              sourceDetail="general-contact-page"
              showReasonSelect
            />
          </div>
        </div>
      </div>
    </main>
  );
}
