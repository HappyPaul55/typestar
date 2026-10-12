import { describe, expect, test } from "bun:test";
import { emailSender, magicLinkEmail } from "./email";
import type { SendEmailBinding } from "./types";

const URL = "https://typestar.happypaul55.com/api/auth/magic-link/verify?token=abc";

describe("magicLinkEmail", () => {
  test("includes the link in both the text and html bodies", () => {
    const { subject, text, html } = magicLinkEmail(URL);
    expect(subject).toBe("Your TypeStar sign-in link");
    expect(text).toContain(URL);
    expect(html).toContain(URL);
  });

  test("states the one-time, expiring nature", () => {
    const { text } = magicLinkEmail(URL, 15);
    expect(text).toMatch(/once/i);
    expect(text).toMatch(/15 minutes/);
  });

  test("is valid enough html to carry the anchor", () => {
    const { html } = magicLinkEmail(URL);
    expect(html).toContain(`href="${URL}"`);
  });
});

describe("emailSender", () => {
  test("passes the rendered email to the binding", async () => {
    const sent: Array<Record<string, unknown>> = [];
    const binding: SendEmailBinding = {
      async send(message) {
        sent.push(message as unknown as Record<string, unknown>);
        return {};
      },
    };
    await emailSender(binding, "TypeStar <signin@example.com>")({
      email: "player@example.com",
      url: URL,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("player@example.com");
    expect(sent[0]?.from).toBe("TypeStar <signin@example.com>");
    expect(String(sent[0]?.text)).toContain(URL);
  });

  test("logs instead of sending when no binding is configured", async () => {
    const original = console.warn;
    const messages: string[] = [];
    console.warn = (message?: unknown) => {
      messages.push(String(message));
    };
    try {
      await emailSender(undefined)({ email: "player@example.com", url: URL });
    } finally {
      console.warn = original;
    }
    expect(messages.join("\n")).toContain(URL);
  });
});
