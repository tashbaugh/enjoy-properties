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
          <p className="mt-3 text-sm text-paper/80">[Your phone / email]</p>
        </div>
      </div>
      <div className="border-t border-paper/10 px-4 py-6 text-center text-xs text-paper/50">
        {/* TREC broker identification goes here once sponsorship is finalized — see build plan compliance note */}
        © {new Date().getFullYear()} Enjoy Properties.
      </div>
    </footer>
  );
}
