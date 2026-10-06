/**
 * Public Turnstile configuration for the client.
 *
 * The sitekey is public — it is embedded in the page — while the matching
 * secret lives only on the Worker as `TURNSTILE_SECRET`. Overridable at build
 * time with `PUBLIC_TURNSTILE_SITEKEY`.
 */
export const TURNSTILE_SITE_KEY =
  import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? "0x4AAAAAAFN0kO3hNISxwO9T";

/** The action set on the widget and checked server-side by siteverify. */
export const TURNSTILE_ACTION = "track";
