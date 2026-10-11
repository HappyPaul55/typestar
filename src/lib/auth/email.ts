/**
 * The magic-link email.
 *
 * {@link magicLinkEmail} is pure (given a URL it returns the subject, text and
 * HTML) so it can be unit-tested without a binding. {@link emailSender} wraps a
 * Cloudflare `send_email` binding, logging the link in development instead of
 * sending when the binding is absent.
 */

import type { MagicLinkSender, SendEmailBinding } from "./types";

/** How long a sign-in link stays valid, in minutes. Mirrors the plugin's TTL. */
const MAGIC_LINK_TTL_MINUTES = 15;

/** The default sender, on the domain onboarded to Email Sending. */
const DEFAULT_EMAIL_FROM = "TypeStar <signin@typestar.happypaul55.com>";

export interface MagicLinkEmail {
  subject: string;
  text: string;
  html: string;
}

/** Render the sign-in email. Pure: no binding, no environment. */
export function magicLinkEmail(
  url: string,
  ttlMinutes = MAGIC_LINK_TTL_MINUTES,
): MagicLinkEmail {
  const subject = "Your TypeStar sign-in link";
  const text = [
    "Sign in to TypeStar",
    "",
    "Open this link to finish signing in:",
    url,
    "",
    `The link works once and expires in ${ttlMinutes} minutes.`,
    "If you did not ask to sign in, you can ignore this email.",
    "",
    "— TypeStar",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;padding:0;background:#0c0d0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0d0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fafaf4;border:2px solid #0c0d0a;">
            <tr>
              <td style="padding:28px 28px 8px;font-family:'Space Grotesk',Arial,sans-serif;color:#0c0d0a;">
                <p style="margin:0 0 4px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a7a;">// sign in</p>
                <h1 style="margin:0;font-size:22px;line-height:1.2;">Sign in to TypeStar</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 4px;font-family:'Space Grotesk',Arial,sans-serif;color:#0c0d0a;font-size:15px;line-height:1.55;">
                <p style="margin:0 0 18px;">Open the link below to finish signing in. It works once and expires in ${ttlMinutes} minutes.</p>
                <p style="margin:0 0 20px;">
                  <a href="${url}" style="display:inline-block;background:#ffe300;color:#0c0d0a;text-decoration:none;font-weight:700;padding:12px 18px;border:2px solid #0c0d0a;">Sign in</a>
                </p>
                <p style="margin:0 0 6px;font-size:13px;color:#5a5a4e;">Or paste this into your browser:</p>
                <p style="margin:0 0 20px;font-size:13px;word-break:break-all;"><a href="${url}" style="color:#0c0d0a;">${url}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-family:'Space Grotesk',Arial,sans-serif;color:#8a8a7a;font-size:12px;line-height:1.5;">
                <p style="margin:0;">If you did not ask to sign in, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

/**
 * Build a {@link MagicLinkSender}. With no binding (local development) the link
 * is logged to the console so it can be copied by hand.
 */
export function emailSender(
  binding: SendEmailBinding | undefined,
  from: string = DEFAULT_EMAIL_FROM,
): MagicLinkSender {
  return async ({ email, url }) => {
    if (!binding) {
      console.warn(`[auth] EMAIL binding not configured — sign-in link for ${email}:\n  ${url}`);
      return;
    }
    const { subject, text, html } = magicLinkEmail(url);
    await binding.send({ from, to: email, subject, text, html });
  };
}
