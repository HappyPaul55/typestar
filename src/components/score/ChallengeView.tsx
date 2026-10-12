/**
 * The daily and weekly challenge: one seeded track and one modifier per period,
 * each with its own typing and singing boards.
 */

import { useEffect, useState } from "react";
import {
  fetchChallenges,
  type ChallengeBoard,
  type ChallengesResponse,
} from "../../lib/score/client";
import { buildHash } from "../../lib/game/url";
import { playHref } from "../../lib/score/format";
import { difficultyLabel, runModeLabel, speedLabel } from "../../i18n/labels";
import type { Locale } from "../../i18n/locales";
import { useT, useLocale, withLocale } from "../../i18n/react";
import Leaderboard from "./Leaderboard";

/** A challenge run link: the track, with the modifier and style in the hash. */
function challengeHref(
  challenge: ChallengeBoard,
  style: "type" | "sing",
  locale: Locale,
): string {
  const hash = buildHash({
    mode: challenge.modifier.difficulty,
    failMode: challenge.modifier.runMode,
    speed: challenge.modifier.speed,
    style,
  });
  return `${playHref(challenge.trackId, "youtube", locale)}${hash}`;
}

function ChallengeCard({
  label,
  challenge,
}: {
  label: string;
  challenge: ChallengeBoard;
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
      <div className="challenge-mods">
        <span className="chip chip--yellow">
          {difficultyLabel(challenge.modifier.difficulty, t)}
        </span>
        <span className="chip">{runModeLabel(challenge.modifier.runMode, t)}</span>
        <span className="chip">{speedLabel(challenge.modifier.speed, t)}</span>
      </div>
      <p className="mt-4 flex flex-wrap gap-2">
        <a className="btn-game btn-game--primary" href={challengeHref(challenge, "type", locale)}>
          {t("challenge.playTyping")}
        </a>
        <a className="btn-game" href={challengeHref(challenge, "sing", locale)}>
          {t("challenge.playSinging")}
        </a>
      </p>
      <div className="challenge-board">
        <p className="group-label">{t("challenge.typingBoard")}</p>
        <Leaderboard entries={challenge.boards.type} />
      </div>
      <div className="challenge-board">
        <p className="group-label">{t("challenge.singingBoard")}</p>
        <Leaderboard
          entries={challenge.boards.sing}
          empty={t("leaderboard.emptySing")}
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
    <div className="challenge-grid">
      <ChallengeCard label={t("challenge.daily")} challenge={data.daily} />
      <ChallengeCard label={t("challenge.weekly")} challenge={data.weekly} />
    </div>
  );
}

export default withLocale(ChallengeView);
