import Image from 'next/image';
import Link from 'next/link';

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
        <p className="mt-4 text-center text-xs text-paper/40">
          © {new Date().getFullYear()} Enjoy Properties.
        </p>
      </div>
    </footer>
  );
}
