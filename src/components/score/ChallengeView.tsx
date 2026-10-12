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
import { DIFFICULTY_LABEL } from "../../lib/game/modes";
import { buildHash } from "../../lib/game/url";
import { playHref } from "../../lib/score/format";
import Leaderboard from "./Leaderboard";

/** A challenge run link: the track, with the modifier and style in the hash. */
function challengeHref(challenge: ChallengeBoard, style: "type" | "sing"): string {
  const hash = buildHash({
    mode: challenge.modifier.difficulty,
    failMode: challenge.modifier.runMode,
    speed: challenge.modifier.speed,
    style,
  });
  return `${playHref(challenge.trackId, "youtube")}${hash}`;
}

function ChallengeCard({
  label,
  challenge,
}: {
  label: string;
  challenge: ChallengeBoard;
}) {
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
          {DIFFICULTY_LABEL[challenge.modifier.difficulty]}
        </span>
        <span className="chip">{challenge.modifier.runMode}</span>
        <span className="chip">{challenge.modifier.speed}×</span>
      </div>
      <p className="mt-4 flex flex-wrap gap-2">
        <a className="btn-game btn-game--primary" href={challengeHref(challenge, "type")}>
          Play typing
        </a>
        <a className="btn-game" href={challengeHref(challenge, "sing")}>
          Play singing
        </a>
      </p>
      <div className="challenge-board">
        <p className="group-label">Typing board</p>
        <Leaderboard entries={challenge.boards.type} />
      </div>
      <div className="challenge-board">
        <p className="group-label">Singing board</p>
        <Leaderboard
          entries={challenge.boards.sing}
          empty="No scored singing yet."
        />
      </div>
    </div>
  );
}

export default function ChallengeView() {
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

  if (failed) return <p className="text-ink-soft">The challenge could not be loaded.</p>;
  if (!data) return <p className="text-ink-soft">Loading challenges…</p>;

  return (
    <div className="challenge-grid">
      <ChallengeCard label="Daily" challenge={data.daily} />
      <ChallengeCard label="Weekly" challenge={data.weekly} />
    </div>
  );
}
