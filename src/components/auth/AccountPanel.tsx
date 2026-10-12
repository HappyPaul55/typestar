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
import {
  handleErrorCode,
  HANDLE_MAX,
  HANDLE_MIN,
  normalizeHandle,
  type HandleError,
} from "../../lib/auth/validate";
import { localePath } from "../../i18n/paths";
import { useT, useLocale, withLocale } from "../../i18n/react";
import type { MessageKey } from "../../i18n";

/** Map a validation code to its dictionary key. */
const HANDLE_ERROR_KEY: Record<HandleError, MessageKey> = {
  empty: "handle.empty",
  length: "handle.length",
  charset: "handle.charset",
  reserved: "handle.reserved",
};

function AccountPanel() {
  const t = useT();
  const locale = useLocale();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="auth-card">
        <p className="text-ink-soft">{t("account.loading")}</p>
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
          {t("account.comment")}
        </p>
        <h2 className="panel__title mt-2">{t("account.signedOutTitle")}</h2>
        <p className="mt-2 text-ink-soft">{t("account.signedOutBody")}</p>
        <p className="mt-5">
          <a className="btn-game btn-game--primary" href={localePath(locale, "/signin")}>
            {t("account.signIn")}
          </a>
        </p>
      </div>
    );
  }

  return <SignedIn />;
}

function SignedIn() {
  const t = useT();
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
    const code = handleErrorCode(handle);
    if (code) {
      setError(t(HANDLE_ERROR_KEY[code], { min: HANDLE_MIN, max: HANDLE_MAX }));
      return;
    }
    const normalized = normalizeHandle(handle);
    if (!normalized) {
      setError(t("account.handleInvalid"));
      return;
    }
    setBusy(true);
    setError(null);
    const { error: apiError } = await authClient.updateUser({
      handle: normalized,
    });
    setBusy(false);
    if (apiError) {
      // Better Auth's own message is English; prefer the localised one.
      setError(t("account.handleTaken"));
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
      setError(t("account.deleteFailed"));
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
        {t("account.comment")}
      </p>
      <h2 className="panel__title mt-2">{t("account.signedInTitle")}</h2>
      <dl className="auth-details mt-3">
        <div>
          <dt>{t("account.email")}</dt>
          <dd>{user.email}</dd>
        </div>
        {memberSince ? (
          <div>
            <dt>{t("account.memberSince")}</dt>
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
          {t("account.handleLabel")}
        </label>
        <p className="auth-hint">{t("account.handleHint")}</p>
        <div className="track-picker__row">
          <input
            id="auth-handle"
            className="track-picker__input"
            type="text"
            name="handle"
            autoComplete="off"
            spellCheck={false}
            value={handle}
            placeholder={t("account.handlePlaceholder")}
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
            {busy ? t("account.saving") : t("account.save")}
          </button>
        </div>
        {error ? <p className="track-picker__error">{error}</p> : null}
        {saved ? <p className="auth-saved">{t("account.saved")}</p> : null}
      </form>

      <div className="auth-actions mt-8">
        <button
          type="button"
          className="btn-game"
          onClick={() => void authClient.signOut()}
        >
          {t("account.signOut")}
        </button>

        {confirmDelete ? (
          <span className="auth-confirm">
            <span>{t("account.deleteConfirm")}</span>
            <button
              type="button"
              className="btn-game auth-danger"
              disabled={busy}
              onClick={() => void removeAccount()}
            >
              {t("account.deleteYes")}
            </button>
            <button
              type="button"
              className="btn-game"
              onClick={() => setConfirmDelete(false)}
            >
              {t("account.cancel")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn-game auth-danger"
            onClick={() => setConfirmDelete(true)}
          >
            {t("account.deleteAccount")}
          </button>
        )}
      </div>
    </div>
  );
}

export default withLocale(AccountPanel);
