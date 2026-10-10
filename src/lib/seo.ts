/**
 * Per-track SEO for the pretty `/play/...` routes.
 *
 * The static play page ships generic tags. When a song is already in the cache
 * or the bundled seed, the Worker fills those tags with the song's own title,
 * description and cover art before serving the page, so crawlers and social
 * cards are accurate. The browser also applies the same values after the track
 * loads, which covers `astro dev` (where the Worker does not run).
 *
 * Both track kinds are handled: a YouTube video uses its thumbnail, while an
 * UltraStar chart fetched from a URL uses its `#COVER` (or the site's own social
 * card when there is none).
 *
 * This module is deliberately runtime-agnostic: it is string-in, string-out, so
 * the Worker and the unit tests share one implementation.
 */

import { trackOrigin, trackPath } from "./track/source";
import type { TrackMedia, TrackOrigin } from "./track/types";

const SITE_NAME = "TypeStar";

export interface TrackSeo {
  /** The document title. */
  title: string;
  description: string;
  canonical: string;
  image: string;
  /** The cover image's MIME type. */
  imageType: string;
  imageAlt: string;
  /** Omitted when the cover's size is unknown (a hotlinked UltraStar cover). */
  imageWidth?: number;
  imageHeight?: number;
}

/** The subset of a track the SEO needs. */
interface SeoTrack {
  id: string;
  title: string;
  origin?: TrackOrigin;
  sourceUrl?: string;
  artist?: string;
  media?: TrackMedia;
}

/** Guess a cover image's MIME type from its URL, defaulting to JPEG. */
function imageTypeOf(url: string): string {
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

/** Build the SEO values for a track. `origin` is the site origin, no slash. */
export function trackSeo(track: SeoTrack, origin: string): TrackSeo {
  const title = track.title.trim() || "Untitled track";
  const base = origin.replace(/\/+$/, "");
  const canonical = `${base}${trackPath(track)}`;

  if (trackOrigin(track) === "ultrastar") {
    const cover = track.media?.cover;
    const by = track.artist ? ` by ${track.artist}` : "";
    return {
      title: `${title} — ${SITE_NAME}`,
      description: `Sing or type ${title}${by} on ${SITE_NAME}: a free rhythm touch-typing and karaoke game.`,
      canonical,
      // A hotlinked cover, or the site's own social card when the chart has none.
      image: cover ?? `${base}/og-image.png`,
      imageType: cover ? imageTypeOf(cover) : "image/png",
      imageAlt: `Cover art for ${title}`,
      // A hotlinked cover's size is unknown; leave the generic hint tags alone.
      ...(cover ? {} : { imageWidth: 1200, imageHeight: 630 }),
    };
  }

  return {
    title: `${title} — ${SITE_NAME}`,
    description: `Play ${title} on ${SITE_NAME}: type the lyrics in time in this free rhythm touch-typing game.`,
    canonical,
    image: `https://i.ytimg.com/vi/${track.id}/maxresdefault.jpg`,
    imageType: "image/jpeg",
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
    "og:image:type": seo.imageType,
    "og:image:secure_url": seo.image,
    "og:image:alt": seo.imageAlt,
    ...(seo.imageWidth !== undefined
      ? { "og:image:width": String(seo.imageWidth) }
      : {}),
    ...(seo.imageHeight !== undefined
      ? { "og:image:height": String(seo.imageHeight) }
      : {}),
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
