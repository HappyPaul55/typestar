/**
 * Per-track SEO for the pretty `/play/<id>` route.
 *
 * The static play page ships generic tags. When a song is already in the cache
 * or the bundled seed, the Worker fills those tags with the song's own title,
 * description and cover art before serving the page, so crawlers and social
 * cards are accurate. The browser also applies the same values after the track
 * loads, which covers `astro dev` (where the Worker does not run).
 *
 * This module is deliberately runtime-agnostic: it is string-in, string-out, so
 * the Worker and the unit tests share one implementation.
 */

export const SITE_NAME = "TypeStar";

export interface TrackSeo {
  /** The document title. */
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}

/** Build the SEO values for a track. `origin` is the site origin, no slash. */
export function trackSeo(
  track: { id: string; title: string },
  origin: string,
): TrackSeo {
  const title = track.title.trim() || "Untitled track";
  return {
    title: `${title} — ${SITE_NAME}`,
    description: `Play ${title} on ${SITE_NAME}: type the lyrics in time in this free rhythm touch-typing game.`,
    canonical: `${origin.replace(/\/+$/, "")}/play/${track.id}`,
    image: `https://i.ytimg.com/vi/${track.id}/maxresdefault.jpg`,
    imageAlt: `Cover art for ${title}`,
    imageWidth: 1280,
    imageHeight: 720,
  };
}

/** The `data-seo` marker on a tag -> the value it should carry. */
export function seoTagValues(seo: TrackSeo): Record<string, string> {
  return {
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    "og:title": seo.title,
    "og:description": seo.description,
    "og:url": seo.canonical,
    "og:image": seo.image,
    "og:image:type": "image/jpeg",
    "og:image:secure_url": seo.image,
    "og:image:alt": seo.imageAlt,
    "og:image:width": String(seo.imageWidth),
    "og:image:height": String(seo.imageHeight),
    "twitter:title": seo.title,
    "twitter:description": seo.description,
    "twitter:image": seo.image,
    "twitter:image:alt": seo.imageAlt,
  };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Set an attribute on a single tag, replacing it or inserting it before `>`. */
function setAttribute(tag: string, name: string, value: string): string {
  const attribute = `${name}="${escapeAttr(value)}"`;
  const existing = new RegExp(`\\b${name}="[^"]*"`);
  if (existing.test(tag)) return tag.replace(existing, attribute);
  return tag.replace(/\s*\/?>$/, (close) => ` ${attribute}${close}`);
}

/**
 * Replace the `data-seo`-marked tags in the static play page with the track's
 * own values. Tags without a marker, and markers without a value, are left as
 * they are.
 */
export function injectTrackSeo(html: string, seo: TrackSeo): string {
  const values = seoTagValues(seo);
  let out = html.replace(
    /<title\b[^>]*\bdata-seo="title"[^>]*>[\s\S]*?<\/title>/i,
    `<title data-seo="title">${escapeText(values.title)}</title>`,
  );

  for (const [key, value] of Object.entries(values)) {
    if (key === "title") continue;
    const attribute = key === "canonical" ? "href" : "content";
    const tag = new RegExp(
      `<(?:meta|link)\\b[^>]*\\bdata-seo="${escapeRegExp(key)}"[^>]*>`,
      "i",
    );
    out = out.replace(tag, (match) => setAttribute(match, attribute, value));
  }
  return out;
}
