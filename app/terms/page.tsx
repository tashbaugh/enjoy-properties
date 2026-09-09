import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  // Bare page name -- the root layout's title.template already appends
  // "| Enjoy Properties"; keeping that suffix here too would double it.
  title: 'Terms and Conditions',
  description: 'Terms governing use of enjoyproperties.us, operated by Tyler Ashbaugh, REALTOR® with Texas Premier Realty, LLC.',
  alternates: {
    canonical: '/terms',
  },
};

export default function Terms() {
  return (
    <main className="bg-paper">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Terms and Conditions', path: '/terms' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-sm text-ink-soft">
          Effective Date: August 30, 2026
          <br />
          Last Updated: August 30, 2026
        </p>

        <p className="mt-8 leading-relaxed text-ink-soft">
          Welcome to enjoyproperties.us (the &quot;Site&quot;), operated by Tyler Ashbaugh, a
          REALTOR® with Texas Premier Realty, LLC. By using this Site or communicating with us
          through it, you agree to the following terms.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Use of the Site</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              This Site provides general information about residential real estate services,
              including buying, selling, renting, and leasing property in the San Antonio, Texas
              area, along with an investment property cash flow analysis tool. Content on this
              Site is for informational purposes only and does not constitute financial, legal, or
              investment advice. Property information, mortgage rates, and cash flow estimates are
              provided for general reference and may not reflect current market conditions; you
              should independently verify any figures before making a financial decision.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. No Guarantee of Representation</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Submitting a form on this Site does not, by itself, create a real estate brokerage
              relationship or client relationship. A formal representation agreement is required
              before Tyler Ashbaugh or Texas Premier Realty, LLC acts as your agent in any
              transaction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Communications (Email &amp; SMS)</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              By submitting your contact information through this Site, you agree that we may
              contact you by email or phone regarding your inquiry.
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              <strong className="text-ink">SMS Terms:</strong>
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                Text messages will only be sent after you have provided your phone number and
                affirmatively confirmed (by replying YES to our initial message) that you wish to
                receive SMS communications.
              </li>
              <li>Message frequency varies based on your inquiry and our follow-up communication.</li>
              <li>Message and data rates may apply.</li>
              <li>
                Reply <strong className="text-ink">STOP</strong> at any time to opt out of SMS
                messages. Reply <strong className="text-ink">HELP</strong> for assistance.
              </li>
              <li>Carriers are not liable for delayed or undelivered messages.</li>
              <li>
                See our{' '}
                <Link href="/privacy" className="underline hover:text-gold">
                  Privacy Policy
                </Link>{' '}
                for details on how your mobile information is used and protected.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Broker Identification</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Tyler Ashbaugh is a licensed Texas Real Estate Sales Agent (TREC License
              #833862-SA) sponsored by Texas Premier Realty, LLC (TREC Broker License
              #9014663-BB). All real estate services are provided under this brokerage
              relationship in accordance with Texas Real Estate Commission rules.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. Fair Housing</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Tyler Ashbaugh and Texas Premier Realty, LLC are committed to compliance with the
              Fair Housing Act and Texas fair housing laws. We do not discriminate on the basis of
              race, color, religion, sex, national origin, familial status, or disability in the
              provision of real estate services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Intellectual Property</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Content on this Site, including text, graphics, and the cash flow calculator tool,
              is owned by Tyler Ashbaugh unless otherwise noted, and may not be reproduced without
              permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              This Site and its content are provided &quot;as is&quot; without warranties of any
              kind. Tyler Ashbaugh and Texas Premier Realty, LLC are not liable for any decisions
              made based on information provided through this Site, including cash flow or cap
              rate estimates generated by the calculator tool.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Changes to These Terms</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We may update these Terms and Conditions from time to time. Continued use of the
              Site after changes are posted constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">9. Governing Law</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              These terms are governed by the laws of the State of Texas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">10. Contact Us</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              <strong className="text-ink">Tyler Ashbaugh</strong>
              <br />
              REALTOR® | Texas Premier Realty, LLC
              <br />
              TREC Sales Agent License #833862-SA
              <br />
              tyler@enjoyproperties.us
              <br />
              enjoyproperties.us
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
