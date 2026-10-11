/**
 * Minimal, dependency-free types for the bindings and collaborators the auth
 * module uses.
 *
 * The Worker declares its bindings inline rather than pulling in
 * `@cloudflare/workers-types`, which clashes with the DOM lib used by the
 * Astro/React side of the repo (see `worker/index.ts`). The auth module follows
 * the same convention, so it stays runtime-agnostic and type-checks under the
 * strict Astro config.
 */

/** The subset of a Cloudflare D1 binding Better Auth relies on. */
export interface D1LikeDatabase {
  prepare(query: string): unknown;
  batch(statements: unknown[]): Promise<unknown>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}

/** A Cloudflare `send_email` binding (Email Sending). */
export interface SendEmailBinding {
  send(message: {
    from: string | { email: string; name?: string };
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
  }): Promise<unknown>;
}

/** Sends one magic-link sign-in email. */
export type MagicLinkSender = (args: {
  email: string;
  url: string;
}) => Promise<void>;

/** The bindings and settings the auth instance needs, from the Worker or dev. */
export interface AuthEnv {
  DB: D1LikeDatabase;
  /** Secret used to sign cookies and hash tokens. At least 32 characters. */
  BETTER_AUTH_SECRET: string;
  /** The `send_email` binding. Absent in dev, where the link is logged. */
  EMAIL?: SendEmailBinding;
  /** The `from` address for sign-in emails. */
  AUTH_EMAIL_FROM?: string;
}
