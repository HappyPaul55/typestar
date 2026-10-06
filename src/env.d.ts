/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Public Turnstile sitekey, exposed to the client at build time. */
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}
