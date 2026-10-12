/**
 * The browser-side Better Auth client, used by the account islands.
 *
 * The client talks to the Worker at the same origin (`/api/auth/*`), so no
 * `baseURL` is needed. `inferAdditionalFields` teaches the client the extra
 * `user` fields (handle, display name) declared on the server, so `session.user`
 * is typed. The `import type` is erased, so the server module (and its D1 and
 * email code) never reaches the browser bundle.
 */

import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";
import type { Auth } from "./server";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), inferAdditionalFields<Auth>()],
});

export const { useSession } = authClient;

/** The Turnstile action the sign-in widget uses; checked server-side. */
export const AUTH_TURNSTILE_ACTION = "auth";
