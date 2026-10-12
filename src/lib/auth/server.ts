/**
 * The Better Auth instance.
 *
 * Better Auth 1.5+ speaks Cloudflare D1 natively (`database: env.DB`), so no
 * Kysely or Drizzle adapter is needed. The instance is built per Worker isolate
 * (see `worker/index.ts`) and per dev server, from the bindings and settings in
 * {@link AuthEnv}.
 *
 * The only sign-in method is an email **magic link**. OAuth is a later addition:
 * Better Auth already records a linked `account` row per provider, so adding a
 * social provider is a config change, not a migration.
 */

import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { emailSender } from "./email";
import { normalizeHandle } from "./validate";
import type { AuthEnv, MagicLinkSender } from "./types";

/** How long a sign-in link is valid, in seconds. */
const MAGIC_LINK_TTL_SECONDS = 15 * 60;

/** The production origin. Used as the dynamic base-URL fallback. */
const PRODUCTION_ORIGIN = "https://typestar.happypaul55.com";

/**
 * Hostnames allowed to resolve the base URL. A listed host also allows its
 * subdomains, which covers the `<branch>.typestar.happypaul55.com` previews.
 */
const ALLOWED_HOSTS = [
  "typestar.happypaul55.com",
  "*.typestar.happypaul55.com",
  "localhost:4321",
  "127.0.0.1:4321",
];

/** Origins allowed to make authenticated requests (CSRF protection). */
const TRUSTED_ORIGINS = [
  PRODUCTION_ORIGIN,
  "https://*.typestar.happypaul55.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

export interface CreateAuthConfig {
  /**
   * The database: a Cloudflare D1 binding in production, a Kysely
   * `node:sqlite` database in `astro dev`, and Better Auth's memory adapter in
   * tests. Typed `unknown` because D1's type would drag in
   * `@cloudflare/workers-types`; Better Auth auto-detects the binding at runtime.
   */
  database: unknown;
  secret: string;
  /** Sends the sign-in email. Defaults to logging when no binding is present. */
  sendMagicLink?: MagicLinkSender;
}

export function createAuth(config: CreateAuthConfig) {
  return betterAuth({
    database: config.database as never,
    secret: config.secret,
    baseURL: {
      allowedHosts: ALLOWED_HOSTS,
      fallback: PRODUCTION_ORIGIN,
      protocol: "auto",
    },
    // Magic link is the only way in; there is no password to set or reset.
    emailAndPassword: { enabled: false },
    user: {
      // Allow a signed-in player to delete their own account (and its data).
      deleteUser: { enabled: true },
      additionalFields: {
        /** Public name; chosen on first sign-in, unique when set. */
        handle: { type: "string", required: false, unique: true, input: true },
        /** Shown name, free text. */
        displayName: { type: "string", required: false, input: true },
        /** Server-owned. Reserved for moderation. */
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
        /** Server-owned. Reserved for moderation. */
        status: {
          type: "string",
          required: false,
          defaultValue: "active",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        update: {
          // The handle is public, so it is validated server-side (the client
          // check is only for feedback).
          before: async (data) => {
            const handle = (data as { handle?: unknown }).handle;
            if (handle === undefined || handle === null) return { data };
            if (typeof handle !== "string") {
              throw new APIError("BAD_REQUEST", { message: "Invalid handle." });
            }
            const normalized = normalizeHandle(handle);
            if (normalized === null) {
              throw new APIError("BAD_REQUEST", { message: "Invalid handle." });
            }
            return { data: { ...data, handle: normalized } };
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        // New players are created on first link; that is the sign-up.
        disableSignUp: false,
        sendMagicLink: async ({ email, url }) => {
          await (config.sendMagicLink ?? emailSender(undefined))({ email, url });
        },
      }),
    ],
    advanced: {
      cookiePrefix: "typestar",
    },
    trustedOrigins: TRUSTED_ORIGINS,
  });
}

/** The type of a Better Auth instance, for client type inference. */
export type Auth = ReturnType<typeof createAuth>;

/** Build the instance from Worker/dev bindings. */
export function authFromEnv(env: AuthEnv) {
  return createAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    sendMagicLink: emailSender(env.EMAIL, env.AUTH_EMAIL_FROM),
  });
}
