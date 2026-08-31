import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Enjoy Properties',
  description: 'How Tyler Ashbaugh, REALTOR® with Texas Premier Realty, LLC, collects, uses, and protects your information on enjoyproperties.us.',
};

export default function Privacy() {
  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-ink-soft">
          Effective Date: August 30, 2026
          <br />
          Last Updated: August 30, 2026
        </p>

        <p className="mt-8 leading-relaxed text-ink-soft">
          Tyler Ashbaugh (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a REALTOR® with Texas
          Premier Realty, LLC, operates the website enjoyproperties.us (the &quot;Site&quot;). This
          Privacy Policy explains how we collect, use, and protect your personal information when
          you use the Site or communicate with us.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Information We Collect</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              When you submit a contact form, use our cash flow calculator, or otherwise
              communicate with us through the Site, we may collect:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>
                Property or search preferences you provide (e.g., buying, renting, leasing,
                investment interests)
              </li>
              <li>Information about how you found us (e.g., referral source, advertising campaign)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. How We Use Your Information</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">We use the information you provide to:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>Respond to your inquiries about buying, selling, renting, or leasing residential property</li>
              <li>Provide personalized follow-up communication, including email and text message updates relevant to your inquiry</li>
              <li>Send you market information or property updates you&apos;ve requested</li>
              <li>Improve our services and communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Text Messaging (SMS)</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              If you provide your phone number, you may receive text messages from us related to
              your inquiry. <strong className="text-ink">We do not send text messages without
              your affirmative consent.</strong> After initial contact, we will send a message
              asking you to confirm you&apos;d like to receive SMS updates by replying YES. You
              will not receive further text messages unless you provide this confirmation.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Message frequency:</strong> Message frequency varies
                based on your inquiry and the nature of our follow-up communication.
              </li>
              <li><strong className="text-ink">Message and data rates may apply.</strong></li>
              <li>
                You may opt out of text messages at any time by replying{' '}
                <strong className="text-ink">STOP</strong>. Reply{' '}
                <strong className="text-ink">HELP</strong> for assistance.
              </li>
              <li>
                <strong className="text-ink">
                  We do not sell, rent, or share your mobile phone number with third parties for
                  their marketing purposes.
                </strong>{' '}
                Your mobile information is used solely for the purpose of communicating with you
                about your real estate inquiry and will not be shared with any third party for
                marketing or promotional purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. How We Share Your Information</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Texas Premier Realty, LLC</strong>, our sponsoring
                brokerage, as necessary to facilitate real estate transactions and comply with
                brokerage recordkeeping obligations
              </li>
              <li>
                Service providers who help us operate the Site and communicate with you (e.g.,
                email delivery, SMS delivery, and hosting providers), solely for the purpose of
                providing those services on our behalf
              </li>
              <li>As required by law, or to protect our legal rights</li>
            </ul>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We do not share your mobile phone number or SMS opt-in status with any third party
              for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. Data Storage &amp; Security</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Your information is stored using industry-standard hosting and database providers.
              We take reasonable measures to protect your personal information, but no method of
              electronic storage or transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Your Choices</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>You may opt out of SMS communications at any time by replying STOP to any text message.</li>
              <li>You may opt out of email communications at any time by using the unsubscribe link included in our emails.</li>
              <li>You may contact us directly (see below) to request that we delete or correct your information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Children&apos;s Privacy</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              The Site is not directed at individuals under 18, and we do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Changes to This Policy</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">9. Contact Us</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              If you have questions about this Privacy Policy or how your information is used,
              contact:
            </p>
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
