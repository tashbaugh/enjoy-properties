// Fetches a Google Font's TTF bytes at build time for use in next/og's
// ImageResponse. That environment has no system/generic fallback font
// available -- every distinct piece of text needs its own explicitly
// loaded font covering its glyphs, or characters missing from whatever
// font *is* registered silently render via a minimal internal fallback
// that looks visibly different (confirmed by rendering actual output:
// loading only Fraunces, scoped to the headline text, left every other
// line rendering with some glyphs in Fraunces and others in that thin
// fallback, mixed within the same word). `text` scopes each request to
// the glyphs actually used, keeping the fetched file small.
//
// Fraunces specifically is a variable font (weight, optical size,
// "soft", "wonk" axes) whose optical-size axis changes letterforms
// dramatically by design. Requesting only `wght` leaves the rest
// unpinned, and resvg doesn't reliably resolve one consistent instance
// from that -- pinning all four axes to single values (not ranges)
// forces Google Fonts to serve one static instance instead.
//
// Deliberately doesn't set a browser-like User-Agent: Google Fonts
// serves WOFF2 to those, which satori/resvg don't reliably decode.
// Node's default fetch UA gets back `format('truetype')` instead.
export async function loadFraunces(weight: number, text: string): Promise<ArrayBuffer> {
  return loadGoogleFontFamily(
    `Fraunces:opsz,wght,SOFT,WONK@40,${weight},0,0`,
    text
  );
}

export async function loadInter(weight: number, text: string): Promise<ArrayBuffer> {
  return loadGoogleFontFamily(`Inter:wght@${weight}`, text);
}

async function loadGoogleFontFamily(familyParam: string, text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\(([^)]+)\)/);

  if (!match) {
    throw new Error(`loadGoogleFontFamily: no font file URL found for "${familyParam}"`);
  }

  const fontResponse = await fetch(match[1]);
  return fontResponse.arrayBuffer();
}
