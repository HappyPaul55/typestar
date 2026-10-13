/**
 * The email sign-in form: enter an email, pass the human check, and receive a
 * one-time sign-in link. The whole flow is the Better Auth magic-link plugin;
 * this component only collects input and reports the outcome.
 *
 * The Turnstile widget is requested on demand, exactly like a new song: the
 * first request goes through, and only a `403` from the server (which happens
 * when Turnstile is configured) reveals the widget and retries with its token.
 * That keeps local development working, where no Turnstile secret is set.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient, AUTH_TURNSTILE_ACTION } from "../../lib/auth/client";
import { normalizeEmail } from "../../lib/auth/validate";
import { TURNSTILE_SITE_KEY } from "../../lib/game/turnstile";
import { localePath } from "../../i18n/paths";
import { useT, useLocale, withLocale } from "../../i18n/react";
import TurnstileChallenge from "../game/TurnstileChallenge";

/** Only same-origin, relative paths are allowed as a post-sign-in destination. */
function safeNext(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function SignInForm({ next }: { next?: string }) {
  const t = useT();
  const locale = useLocale();
  const [destination, setDestination] = useState(
    safeNext(next, localePath(locale, "/account")),
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsChallenge, setNeedsChallenge] = useState(false);
  // A spent Turnstile token needs a fresh widget, so remount it on each try.
  const [challengeId, setChallengeId] = useState(0);

  // Refs keep the send callback (and so the widget) stable across keystrokes.
  const emailRef = useRef(email);
  emailRef.current = email;
  const destinationRef = useRef(destination);
  destinationRef.current = destination;

  // Read `?next=` on the client: these pages are static, so the query string is
  // only known in the browser (and only then without a hydration mismatch).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDestination(safeNext(params.get("next") ?? next, localePath(locale, "/account")));
  }, [locale, next]);

  const send = useCallback(async (turnstileToken: string | null) => {
    const value = normalizeEmail(emailRef.current);
    if (!value) return;
    setBusy(true);
    setError(null);
    const { error: apiError } = await authClient.signIn.magicLink({
      email: value,
      callbackURL: destinationRef.current,
      ...(turnstileToken
        ? { fetchOptions: { headers: { "x-turnstile-token": turnstileToken } } }
        : {}),
    });
    setBusy(false);

    if (!apiError) {
      setSent(true);
      return;
    }
    if (apiError.status === 403) {
      // Turnstile is configured: show the widget and let the player retry.
      setNeedsChallenge(true);
      setError(t("signin.needCheck"));
      setChallengeId((id) => id + 1);
      return;
    }
    setError(t("signin.sendFailed"));
  }, [t]);

  const onToken = useCallback(
    (value: string) => {
      void send(value);
    },
    [send],
  );
  const onChallengeError = useCallback((message: string) => {
    setError(message);
  }, []);

  async function submit() {
    const value = normalizeEmail(email);
    if (!value) {
      setError(t("signin.invalidEmail"));
      return;
    }
    await send(null);
  }

  if (sent) {
    return (
      <div className="auth-card">
        <p className="comment">
          <span className="slash" aria-hidden="true">
            //
          </span>{" "}
          {t("signin.sentComment")}
        </p>
        <h2 className="panel__title mt-2">{t("signin.sentTitle")}</h2>
        <p className="mt-2 text-ink-soft">
          {t("signin.sentBody", { email })}
        </p>
        <p className="mt-4 text-ink-soft">
          {t("signin.nothing")}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setSent(false);
              setChallengeId((id) => id + 1);
            }}
          >
            {t("signin.tryAgain")}
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        {t("signin.comment")}
      </p>
      <h2 className="panel__title mt-2">{t("signin.formTitle")}</h2>
      <p className="mt-2 text-ink-soft">{t("signin.formBody")}</p>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        noValidate
      >
        <label className="auth-label" htmlFor="auth-email">
          {t("signin.emailLabel")}
        </label>
        <input
          id="auth-email"
          className="track-picker__input"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
        />

        {needsChallenge ? (
          <div className="auth-turnstile">
            <TurnstileChallenge
              key={challengeId}
              siteKey={TURNSTILE_SITE_KEY}
              action={AUTH_TURNSTILE_ACTION}
              onToken={onToken}
              onError={onChallengeError}
            />
          </div>
        ) : null}

        {error ? <p className="track-picker__error">{error}</p> : null}

        <button
          type="submit"
          className="btn-game btn-game--primary auth-submit"
          disabled={busy}
        >
          {busy ? t("signin.sending") : t("signin.submit")}
        </button>
      </form>
    </div>
  );
}

export default withLocale(SignInForm);
