// Single source of truth -- TPR's own hosted copy, so this stays current
// whenever they update the form. Used in the site footer and in any
// automated communication that needs to reference it (e.g. the welcome
// email), per the TREC IABS requirement.
export const IABS_URL = 'https://tprofficeinfo.com/wp-content/uploads/2026/01/2026-IABS-Updated.pdf';

// Canonical production origin -- used for metadataBase (app/layout.tsx),
// robots.ts, and sitemap.ts, so the domain lives in exactly one place.
export const SITE_URL = 'https://www.enjoyproperties.us';

export const SITE_NAME = 'Enjoy Properties';

// Next.js metadata merging is shallow per nested object (see the App
// Router docs' "Merging" section): a page that declares its own
// `openGraph` or `twitter` object replaces the root layout's entirely,
// it does not merge field-by-field. A page overriding just `title`
// silently loses the root's `type`/`siteName`/`locale`/`card` unless
// it repeats them -- confirmed by rendering actual page output, where
// og:site_name/type/locale and twitter:card all disappeared the
// moment a page added its own title-only openGraph/twitter override.
// Spread these into every page-level override so that can't happen.
//
// Shared with app/opengraph-image.tsx's own `size`/`alt` exports, so
// the dimensions/alt text can't drift between the generated file and
// the metadata objects below that reference it by URL.
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = 'Enjoy Properties -- San Antonio Real Estate, Done Right';

// `images` is included here for the same reason and it's not optional
// the way the others are: app/opengraph-image.tsx is colocated with
// the root segment (app/page.tsx), so the image only auto-attaches
// "for free" to that exact route. Every deeper route (/invest,
// /contact, ...) only *inherits* it through the metadata tree, so the
// moment such a route defines its own openGraph object at all, the
// inherited image is replaced along with everything else -- confirmed
// by rendering actual output: /invest and /contact had zero og:image
// tags until this was added explicitly. /privacy and /terms never hit
// this because they don't override openGraph at all, so they inherit
// the root's object, image included.
//
// Specified as a full object, not a bare URL string -- a bare string
// resolves fine but silently drops og:image:type/width/height/alt
// (confirmed by rendering actual output), which some platforms
// (Facebook in particular) rely on for correct preview rendering.
export const BASE_OPENGRAPH = {
  type: 'website' as const,
  siteName: SITE_NAME,
  locale: 'en_US',
  images: [
    {
      url: '/opengraph-image',
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: OG_IMAGE_ALT,
    },
  ],
};

export const BASE_TWITTER = {
  card: 'summary_large_image' as const,
};
