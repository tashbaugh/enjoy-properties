// Per Next.js's own JSON-LD guide: a native <script> tag, not
// next/script (that's optimized for executable JS; this is inert
// structured data). JSON.stringify doesn't escape `<`, which could
// otherwise break out of the script tag if a value ever contained
// something like "</script>" -- replaced with its unicode escape as
// the docs recommend, even though every value here is a static string
// today, not user input.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
