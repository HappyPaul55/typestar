/**
 * The daily and weekly challenge: one seeded track per period, with its own
 * typing and singing boards. The song carries no modifier, so any run of it
 * counts. The previous day and week follow underneath as final standings.
 */

import { useEffect, useState } from "react";
import {
  fetchChallenges,
  type ChallengeBoard,
  type ChallengesResponse,
} from "../../lib/score/client";
import { buildHash } from "../../lib/game/url";
import { playHref } from "../../lib/score/format";
import type { Translate } from "../../i18n";
import type { Locale } from "../../i18n/locales";
import { useT, useLocale, withLocale } from "../../i18n/react";
import Leaderboard from "./Leaderboard";

/** A challenge run link: the track, with the play style in the hash. */
function challengeHref(
  challenge: ChallengeBoard,
  style: "type" | "sing",
  locale: Locale,
): string {
  return `${playHref(challenge.trackId, "youtube", locale)}${buildHash({ style })}`;
}

/** The period's dates, e.g. `12 Oct`, or `5 – 11 Oct` for a week. */
function periodLabel(challenge: ChallengeBoard, locale: Locale, t: Translate): string {
  // The period boundaries are UTC, so the dates are read in UTC too.
  const day = (time: number) =>
    new Date(time).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const start = new Date(challenge.startsAt).getTime();
  const end = new Date(challenge.endsAt).getTime();
  if (challenge.period === "daily") return day(start);
  // `endsAt` is exclusive: the last day is the instant just before it.
  return t("challenge.periodRange", { start: day(start), end: day(end - 1) });
}

function ChallengeCard({
  label,
  challenge,
  finished = false,
}: {
  label: string;
  challenge: ChallengeBoard;
  /** A closed period: no play buttons, and its boards are final. */
  finished?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="score-card">
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        {label}
      </p>
      <div className="score-card__head mt-2">
        <span className="score-card__title">{challenge.track.title}</span>
        <span className="score-card__meta">{challenge.track.artist}</span>
      </div>
      {finished ? (
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <span className="chip chip--yellow">{t("challenge.finished")}</span>
          <span className="score-card__meta">{periodLabel(challenge, locale, t)}</span>
        </p>
      ) : (
        <p className="mt-4 flex flex-wrap gap-2">
          <a className="btn-game btn-game--primary" href={challengeHref(challenge, "type", locale)}>
            {t("challenge.playTyping")}
          </a>
          <a className="btn-game" href={challengeHref(challenge, "sing", locale)}>
            {t("challenge.playSinging")}
          </a>
        </p>
      )}
      <div className="challenge-board">
        <p className="group-label">{t("challenge.typingBoard")}</p>
        <Leaderboard
          entries={challenge.boards.type}
          empty={finished ? t("challenge.pastEmpty") : undefined}
        />
      </div>
      <div className="challenge-board">
        <p className="group-label">{t("challenge.singingBoard")}</p>
        <Leaderboard
          entries={challenge.boards.sing}
          empty={finished ? t("challenge.pastEmpty") : t("leaderboard.emptySing")}
        />
      </div>
    </div>
  );
}

function ChallengeView() {
  const t = useT();
  const [data, setData] = useState<ChallengesResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchChallenges().then((result) => {
      if (cancelled) return;
      if (!result) {
        setFailed(true);
        return;
      }
      setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="text-ink-soft">{t("challenge.error")}</p>;
  if (!data) return <p className="text-ink-soft">{t("challenge.loading")}</p>;

  return (
    <div>
      <div className="challenge-grid">
        <ChallengeCard label={t("challenge.daily")} challenge={data.daily} />
        <ChallengeCard label={t("challenge.weekly")} challenge={data.weekly} />
      </div>

      <div className="challenge-previous">
        <p className="group-label">{t("challenge.previousHeading")}</p>
        <div className="challenge-grid">
          <ChallengeCard
            label={t("challenge.daily")}
            challenge={data.previous.daily}
            finished
          />
          <ChallengeCard
            label={t("challenge.weekly")}
            challenge={data.previous.weekly}
            finished
          />
        </div>
      </div>
    </div>
  );
}

export default withLocale(ChallengeView);
