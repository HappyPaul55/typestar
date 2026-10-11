/**
 * The account panel.
 *
 * Signed out it points at the sign-in page; signed in it shows the email, the
 * chosen handle (editable), and sign-out / delete controls. It reads the live
 * session from the Better Auth client, so it updates the moment the state
 * changes.
 */

import { useEffect, useState } from "react";
import { authClient, useSession } from "../../lib/auth/client";
import { handleError, normalizeHandle } from "../../lib/auth/validate";

export default function AccountPanel() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="auth-card">
        <p className="text-ink-soft">Loading your account…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-card">
        <p className="comment">
          <span className="slash" aria-hidden="true">
            //
          </span>{" "}
          account
        </p>
        <h2 className="panel__title mt-2">You&rsquo;re not signed in</h2>
        <p className="mt-2 text-ink-soft">
          Sign in with a one-time email link to keep your scores and settings
          across devices.
        </p>
        <p className="mt-5">
          <a className="btn-game btn-game--primary" href="/signin">
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return <SignedIn />;
}

function SignedIn() {
  const { data: session } = useSession();
  const user = session?.user;
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Keep the field in step when the session (and its handle) loads or changes.
  useEffect(() => {
    setHandle(user?.handle ?? "");
  }, [user?.handle]);

  if (!user) return null;

  async function saveHandle() {
    setSaved(false);
    const message = handleError(handle);
    if (message) {
      setError(message);
      return;
    }
    const normalized = normalizeHandle(handle);
    if (!normalized) {
      setError("That handle can’t be used.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: apiError } = await authClient.updateUser({
      handle: normalized,
    });
    setBusy(false);
    if (apiError) {
      setError(
        apiError.message ??
          "That handle is taken or invalid. Please try another.",
      );
      return;
    }
    setHandle(normalized);
    setSaved(true);
  }

  async function removeAccount() {
    setBusy(true);
    setError(null);
    const { error: apiError } = await authClient.deleteUser();
    setBusy(false);
    if (apiError) {
      setError(apiError.message ?? "Could not delete the account.");
      return;
    }
    window.location.assign("/");
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="auth-card">
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        account
      </p>
      <h2 className="panel__title mt-2">Signed in</h2>
      <dl className="auth-details mt-3">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        {memberSince ? (
          <div>
            <dt>Member since</dt>
            <dd>{memberSince}</dd>
          </div>
        ) : null}
      </dl>

      <form
        className="auth-form mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          void saveHandle();
        }}
        noValidate
      >
        <label className="auth-label" htmlFor="auth-handle">
          Handle
        </label>
        <p className="auth-hint">
          Your public name on leaderboards. Lowercase letters, numbers and
          underscores, 3–20 characters.
        </p>
        <div className="track-picker__row">
          <input
            id="auth-handle"
            className="track-picker__input"
            type="text"
            name="handle"
            autoComplete="off"
            spellCheck={false}
            value={handle}
            placeholder="e.g. type_star"
            onChange={(event) => {
              setHandle(event.target.value);
              setError(null);
              setSaved(false);
            }}
          />
          <button
            type="submit"
            className="btn-game btn-game--primary"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {error ? <p className="track-picker__error">{error}</p> : null}
        {saved ? <p className="auth-saved">Handle saved.</p> : null}
      </form>

      <div className="auth-actions mt-8">
        <button
          type="button"
          className="btn-game"
          onClick={() => void authClient.signOut()}
        >
          Sign out
        </button>

        {confirmDelete ? (
          <span className="auth-confirm">
            <span>Delete your account and all its data?</span>
            <button
              type="button"
              className="btn-game auth-danger"
              disabled={busy}
              onClick={() => void removeAccount()}
            >
              Yes, delete
            </button>
            <button
              type="button"
              className="btn-game"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn-game auth-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
