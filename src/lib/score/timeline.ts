/**
 * The recorded event timeline for a run.
 *
 * The client records the *inputs* the engine saw — keystrokes and pitch samples,
 * plus seeks and the finish — with the player clock. The server replays them
 * against the track's own timings to derive the score, so the score is never
 * trusted from the client. Ticks are not recorded: the server generates them,
 * because they only mark words/notes whose window has closed.
 *
 * `checksum` is an integrity check over the canonical event string plus the
 * nonce. It catches a corrupted or edited payload; it is not a defence against a
 * determined cheater, which is why a failed check marks the score invalid
 * rather than discarding it.
 */

export const TIMELINE_VERSION = 1;

/** Hard caps so a submission cannot be used to burn CPU or storage. */
const MAX_EVENTS = 20000;
const MAX_EVENT_TIME = 3600;
const MAX_KEY_LENGTH = 16;

export type TimelineEvent =
  | { t: "k"; at: number; key: string }
  | { t: "s"; at: number; m: number | null; r: number }
  | { t: "r"; at: number }
  | { t: "w"; at: number }
  | { t: "f"; at: number };

export interface Timeline {
  version: number;
  events: TimelineEvent[];
}

function isFiniteTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_EVENT_TIME;
}

/** Validate one event. Unknown shapes are rejected so a payload cannot smuggle. */
function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record<string, unknown>;
  if (!isFiniteTime(event.at)) return false;
  switch (event.t) {
    case "k":
      return typeof event.key === "string" && event.key.length > 0 && event.key.length <= MAX_KEY_LENGTH;
    case "s":
      return (
        (event.m === null || (typeof event.m === "number" && Number.isFinite(event.m))) &&
        typeof event.r === "number" &&
        Number.isFinite(event.r)
      );
    case "r":
    case "w":
    case "f":
      return true;
    default:
      return false;
  }
}

/** Parse and validate a submitted timeline, or `null` when it is unusable. */
export function parseTimeline(value: unknown): Timeline | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as { version?: unknown; events?: unknown };
  if (raw.version !== TIMELINE_VERSION) return null;
  if (!Array.isArray(raw.events) || raw.events.length === 0) return null;
  if (raw.events.length > MAX_EVENTS) return null;
  const events: TimelineEvent[] = [];
  for (const item of raw.events) {
    if (!isTimelineEvent(item)) return null;
    events.push(item);
  }
  return { version: TIMELINE_VERSION, events };
}

/**
 * A canonical, order-stable string for the events. JSON key order is not
 * guaranteed across producers, so the checksum is taken over this instead.
 */
export function canonicalTimeline(events: readonly TimelineEvent[]): string {
  const parts: string[] = [];
  for (const event of events) {
    switch (event.t) {
      case "k":
        parts.push(`k:${event.at}:${event.key}`);
        break;
      case "s":
        parts.push(`s:${event.at}:${event.m ?? ""}:${event.r}`);
        break;
      default:
        parts.push(`${event.t}:${event.at}`);
    }
  }
  return parts.join("|");
}

/** The integrity checksum over the nonce and the canonical event string. */
export async function timelineChecksum(
  nonce: string,
  events: readonly TimelineEvent[],
): Promise<string> {
  const data = new TextEncoder().encode(`${nonce}\n${canonicalTimeline(events)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
