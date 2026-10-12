/**
 * The "Embed" button on the play page: copies a ready-made `<iframe>` snippet
 * for the current song. Local songs have no shareable URL, so it hides there.
 */

import { useCallback, useEffect, useState } from "react";
import { sourceFromLocation } from "../../lib/game/client";
import { videoIdOf } from "../../lib/track/source";
import { useT } from "../../i18n/react";

/** The embed URL for the current page, or `null` when there is none. */
function embedUrl(): string | null {
  if (typeof window === "undefined") return null;
  const source = sourceFromLocation();
  if (!source) return null;
  if (source.kind === "youtube") {
    return `${window.location.origin}/embed/youtube/${videoIdOf(`youtube-${source.id}`)}`;
  }
  return `${window.location.origin}/embed/ultrastar/${encodeURIComponent(source.url)}`;
}

function snippet(url: string): string {
  return `<iframe src="${url}" width="640" height="360" style="border:0;max-width:100%" allow="autoplay; fullscreen; microphone" loading="lazy" title="TypeStar"></iframe>`;
}

export default function EmbedButton() {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(embedUrl());
  }, []);

  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(snippet(url));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable; nothing more to do.
    }
  }, [url]);

  if (!url) return null;

  return (
    <button type="button" className="btn-game" onClick={() => void copy()}>
      {copied ? t("embed.copied") : t("embed.button")}
    </button>
  );
}
