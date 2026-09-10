import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  // Bare page name -- the root layout's title.template already appends
  // "| Enjoy Properties"; keeping that suffix here too would double it.
  title: 'Privacy Policy',
  description: 'How Tyler Ashbaugh, REALTOR® with Texas Premier Realty, LLC, collects, uses, and protects your information on enjoyproperties.us.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function Privacy() {
  return (
    <main className="bg-paper">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ])}
      />
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-ink-soft">
          Effective Date: August 30, 2026
          <br />
          Last Updated: September 10, 2026
        </p>

        <p className="mt-8 leading-relaxed text-ink-soft">
          I, Tyler Ashbaugh (&quot;I,&quot; &quot;me,&quot; or &quot;my&quot;), operate the website
          enjoyproperties.us (the &quot;Site&quot;). I am a licensed Texas REALTOR® sales agent
          (TREC License #833862-SA), sponsored by Texas Premier Realty, LLC (TREC Broker License
          #9014663-BB), a licensed real estate brokerage. I am an independently contracted sales
          agent &mdash; not an employee, member, or owner of the brokerage. This Privacy Policy
          explains how I collect, use, and protect your personal information when you use the Site
          or communicate with me.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Information I Collect</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              When you submit a contact form, use my cash flow calculator, or otherwise
              communicate with me through the Site, I may collect:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>
                Property or search preferences you provide (e.g., buying, renting, leasing,
                investment interests)
              </li>
              <li>Information about how you found me (e.g., referral source, advertising campaign)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. How I Use Your Information</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">I use the information you provide to:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>Respond to your inquiries about buying, selling, renting, or leasing residential property</li>
              <li>Provide personalized follow-up communication, including email and text message updates relevant to your inquiry</li>
              <li>Send you market information or property updates you&apos;ve requested</li>
              <li>Improve my services and communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Text Messaging (SMS)</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              If you provide your phone number, you may receive text messages from me related to
              your inquiry. <strong className="text-ink">I do not send text messages without
              your affirmative consent.</strong> After initial contact, I will send a message
              asking you to confirm you&apos;d like to receive SMS updates by replying YES. You
              will not receive further text messages unless you provide this confirmation.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Message frequency:</strong> Message frequency varies
                based on your inquiry and the nature of my follow-up communication.
              </li>
              <li><strong className="text-ink">Message and data rates may apply.</strong></li>
              <li>
                You may opt out of text messages at any time by replying{' '}
                <strong className="text-ink">STOP</strong>. Reply{' '}
                <strong className="text-ink">HELP</strong> for assistance.
              </li>
              <li>
                <strong className="text-ink">
                  I do not sell, rent, or share your mobile phone number with third parties for
                  their marketing purposes.
                </strong>{' '}
                Your mobile information is used solely for the purpose of communicating with you
                about your real estate inquiry and will not be shared with any third party for
                marketing or promotional purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Cookies &amp; Tracking Technologies</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              I use a small number of third-party tracking technologies to measure how well my
              advertising is working:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Google Ads conversion tracking</strong> (Google&apos;s
                gtag.js): when you submit a form on the Site, I let Google know a conversion
                occurred and which ad campaign, if any, brought you here. This does not include
                your name, email, or phone number.
              </li>
              <li>
                <strong className="text-ink">Meta Pixel:</strong> similarly records that an
                inquiry occurred when you submit a form, tagged only with a general category
                (e.g., buyer, investor) so I can measure ad performance on Facebook and
                Instagram. Meta may also use standard browser and device signals for its own
                ad-matching purposes, under Meta&apos;s own data policy.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Both are only active on pages running an active ad campaign, and only once
              I&apos;ve configured them &mdash; if I haven&apos;t, they don&apos;t load at all.
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              <strong className="text-ink">Your choices:</strong> You can block or limit these
              technologies through your browser&apos;s cookie and tracking settings,{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold"
              >
                Google&apos;s Ad Settings
              </a>
              , or{' '}
              <a
                href="https://www.facebook.com/adpreferences"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold"
              >
                Meta&apos;s Ad Preferences
              </a>
              . Blocking them doesn&apos;t affect your ability to use the Site or submit an
              inquiry &mdash; it only affects how I measure ad performance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. How I Share Your Information</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              I do not sell your personal information. I may share your information with:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Texas Premier Realty, LLC</strong>, my sponsoring
                brokerage, as necessary to facilitate real estate transactions and comply with
                brokerage recordkeeping obligations
              </li>
              <li>
                Service providers who help me operate the Site and communicate with you (e.g.,
                email delivery, SMS delivery, and hosting providers), solely for the purpose of
                providing those services on my behalf
              </li>
              <li>
                <strong className="text-ink">Advertising platforms</strong> (Google Ads, Meta),
                limited to the conversion tracking described in Section 4 above &mdash; I do not
                send them your name, email, or phone number
              </li>
              <li>
                <strong className="text-ink">AI tools</strong> I use to help draft personalized
                follow-up messages. When you provide search details (e.g., price range, areas of
                interest), I may share your first name and those search details with an AI
                service to help draft relevant follow-up content &mdash; never your full name,
                email, phone number, or any other information beyond what&apos;s needed for that
                purpose
              </li>
              <li>As required by law, or to protect my legal rights</li>
            </ul>
            <p className="mt-3 leading-relaxed text-ink-soft">
              I do not share your mobile phone number or SMS opt-in status with any third party
              for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Data Storage &amp; Security</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Your information is stored using industry-standard hosting and database providers.
              I take reasonable measures to protect your personal information, but no method of
              electronic storage or transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Your Choices</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>You may opt out of SMS communications at any time by replying STOP to any text message.</li>
              <li>You may opt out of email communications at any time by using the unsubscribe link included in my emails.</li>
              <li>You may limit advertising cookies and tracking as described in Section 4.</li>
              <li>You may contact me directly (see below) to request that I delete or correct your information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Children&apos;s Privacy</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              The Site is not directed at individuals under 18, and I do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">9. Changes to This Policy</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              I may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">10. Contact Us</h2>
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
