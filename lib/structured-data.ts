import { SITE_URL, SITE_NAME } from '@/lib/constants';

// Validated against the live schema.org type definitions (RealEstateAgent,
// its LocalBusiness/Organization/Thing ancestors, areaServed,
// EducationalOccupationalCredential, WebSite, BreadcrumbList/ListItem,
// PostalAddress) and against Google's own Search Central docs for
// LocalBusiness and Breadcrumb rich results -- see the handoff notes for
// exactly what was checked.
//
// `address` is Texas Premier Realty's public brokerage office (the
// business location Tyler operates from as a sponsored agent), not a
// personal address -- required alongside `name` per Google's LocalBusiness
// guidance, and placed on RealEstateAgent itself (not nested under
// parentOrganization) since that's the LocalBusiness-typed entity Google's
// parser evaluates. Cross-checked against three independent public
// sources (Yelp business listings, MLS agent profiles, aggregated search)
// that all agree on this address for the brokerage's office -- not the
// separate address-on-file some sources list for the broker individually.
export function realEstateAgentJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Tyler Ashbaugh',
    url: SITE_URL,
    image: `${SITE_URL}/tyler-headshot.jpg`,
    telephone: '+1-210-419-2016',
    areaServed: 'San Antonio, TX and surrounding areas',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8620 N New Braunfels Ave, Suite 620',
      addressLocality: 'San Antonio',
      addressRegion: 'TX',
      postalCode: '78217',
      addressCountry: 'US',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Texas Premier Realty, LLC',
    },
    // Ordered by entity weight: Google's own listing, then the
    // brokerage page corroborating the license affiliation, then the
    // industry directory, then social. The Texas Premier Realty URL's
    // %20 is intentional, not a typo -- kept exactly as given, matching
    // how the URL actually resolves.
    sameAs: [
      'https://maps.google.com/?cid=4846459664991354863',
      'https://www.texaspremierrealty.com/agents/2098460/Tyler%20Ashbaugh',
      'https://www.realtor.com/realestateagents/67ed1a765c4dd52b64252b2e',
      'https://www.facebook.com/tylerashbaughrealtor/',
      'https://www.instagram.com/tylerashbaughrealtor/',
      'https://www.linkedin.com/in/tylerashbaugh',
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: 'Texas Real Estate Commission Sales Agent License',
      identifier: '833862-SA',
      recognizedBy: {
        '@type': 'GovernmentOrganization',
        name: 'Texas Real Estate Commission',
      },
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

// Google's documented BreadcrumbList shape specifically (position/name/item
// as a flat URL string on each ListItem), not schema.org's own alternate
// nested-item example -- both validate against schema.org's vocabulary, but
// only the flat form matches what Google's rich-result parser expects.
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      // path === '/' needs special-casing: SITE_URL + '/' would resolve
      // to ".../us/", a trailing slash that doesn't byte-match the
      // canonical homepage URL used everywhere else (".../us", no
      // trailing slash) -- same page either way, but not worth the
      // inconsistency.
      item: item.path === '/' ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  };
}
