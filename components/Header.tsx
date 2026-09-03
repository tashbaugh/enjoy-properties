import Link from 'next/link';

const NAV_LINKS = [
  { href: '/#buy', label: 'Buy' },
  { href: '/#sell', label: 'Sell' },
  { href: '/#rent', label: 'Rent' },
  { href: '/#list-rental', label: 'List a Rental' },
  { href: '/invest', label: 'Invest' },
];

const BOLDTRAIL_SEARCH_URL = 'https://tylerashbaugh.texaspremierrealty.com/';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          Enjoy Properties
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium text-ink-soft">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
          <a
            href={BOLDTRAIL_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-ink"
          >
            Search Homes
          </a>
        </nav>
        <Link
          href="/contact"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-gold"
        >
          Get in touch
        </Link>
      </div>
    </header>
  );
}
