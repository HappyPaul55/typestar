/**
 * A lightweight "is someone signed in?" check for the game island.
 *
 * The full auth client (`better-auth/react`) is only needed on the account
 * pages; the game island just needs to know whether to record a run, so it asks
 * the session endpoint directly. That keeps the auth client out of the play and
 * embed bundles.
 */

import { useEffect, useState } from "react";

/** Whether a signed-in session exists. Best-effort: failures read as signed out. */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/get-session", { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (cancelled) return;
        const user = (data as { user?: unknown } | null)?.user;
        setSignedIn(Boolean(user));
      })
      .catch(() => {
        // Signed out (or the endpoint is unavailable): record nothing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return signedIn;
}
