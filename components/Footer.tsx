import Image from 'next/image';
import Link from 'next/link';
import { IABS_URL } from '@/lib/constants';

function EqualHousingIcon() {
  return (
    <svg
      viewBox="0 0 36 36"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="shrink-0 text-paper/70"
    >
      <circle cx="18" cy="18" r="16.5" />
      <path d="M9 17 L18 9 L27 17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 15.5 V26 H24.5 V15.5" strokeLinejoin="round" />
      <path d="M16 26 V20 H20 V26" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">Enjoy Properties</p>
          <p className="mt-2 text-sm text-paper/70">
            San Antonio real estate — buying, selling, and leasing, backed by real market data.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-paper/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/80">
            <li><Link href="/#buy" className="hover:text-gold">Buy</Link></li>
            <li><Link href="/#rent" className="hover:text-gold">Rent</Link></li>
            <li><Link href="/#list-rental" className="hover:text-gold">List a Rental</Link></li>
            <li><Link href="/invest" className="hover:text-gold">Invest</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-paper/50">Contact</p>
          <p className="mt-3 text-sm text-paper/80">
            <a href="tel:+12104192016" className="hover:text-gold">210-419-2016</a>
          </p>
        </div>
      </div>
      <div className="border-t border-paper/10 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
          <Image
            src="/tpr-logo.png"
            alt="Texas Premier Realty, LLC"
            width={140}
            height={46}
            className="h-8 w-auto rounded bg-paper px-2 py-1"
          />
          <p className="text-sm font-medium text-paper/90">
            Tyler Ashbaugh, REALTOR® | Texas Premier Realty, LLC | TREC Lic. #833862-SA
          </p>
        </div>
        <p className="mt-2 text-center text-xs text-paper/60">
          <a
            href={IABS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold"
          >
            Texas Real Estate Commission Information About Brokerage Services
          </a>
        </p>
        <div className="mt-3 flex flex-col items-center justify-center gap-1.5 text-center sm:flex-row sm:gap-2">
          <EqualHousingIcon />
          <p className="text-xs text-paper/60">
            Tyler Ashbaugh is committed to compliance with all federal, state, and local fair
            housing laws. Equal Housing Opportunity.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-paper/40">
          © {new Date().getFullYear()} Enjoy Properties.
        </p>
      </div>
    </footer>
  );
}
