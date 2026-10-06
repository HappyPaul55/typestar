/**
 * Renders the Cloudflare Turnstile widget on demand.
 *
 * It is only mounted when the track API asks for a human check, which happens
 * for a song that is not already cached or bundled. The token is handed to the
 * caller, which retries the request with it. Tokens are single-use, so each
 * attempt gets a fresh widget (the caller remounts with a new key).
 */

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove?(widgetId: string): void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_PREFIX = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise: Promise<void> | null = null;

/** Load the Turnstile script once, sharing the promise between mounts. */
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as TurnstileWindow).turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${SCRIPT_PREFIX}"]`,
    );
    const onLoad = () => resolve();
    const onError = () => reject(new Error("turnstile script failed to load"));

    if (existing) {
      if ((window as TurnstileWindow).turnstile) resolve();
      else {
        existing.addEventListener("load", onLoad, { once: true });
        existing.addEventListener("error", onError, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface Props {
  siteKey: string;
  action?: string;
  onToken(token: string): void;
  onError?(message: string): void;
}

export default function TurnstileChallenge({
  siteKey,
  action = "track",
  onToken,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | undefined;
    const container = containerRef.current;
    const api = () => (window as TurnstileWindow).turnstile;

    loadScript()
      .then(() => {
        const turnstile = api();
        if (cancelled || !container || !turnstile) return;
        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          action,
          theme: "light",
          callback: (token: string) => onToken(token),
          "error-callback": () =>
            onError?.("The human check failed. Please try again."),
          "expired-callback": () =>
            onError?.("The human check expired. Please try again."),
        });
      })
      .catch(() => {
        if (!cancelled) onError?.("Could not load the human check.");
      });

    return () => {
      cancelled = true;
      if (widgetId === undefined) return;
      try {
        api()?.remove?.(widgetId);
      } catch {
        // Widget already gone; nothing to clean up.
      }
    };
  }, [siteKey, action, onToken, onError]);

  return <div className="turnstile" ref={containerRef} />;
}
