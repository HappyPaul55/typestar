/**
 * Boards for every featured song, with the shared mode filters. Typing and
 * singing are separate boards, since the two are not comparable.
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_MODE_QUERY,
  fetchBoards,
  type BoardsResponse,
  type ModeQuery,
} from "../../lib/score/client";
import { playHref } from "../../lib/score/format";
import Leaderboard from "./Leaderboard";
import ScoreFilters from "./ScoreFilters";

export default function BoardsBrowser() {
  const [filter, setFilter] = useState<ModeQuery>(DEFAULT_MODE_QUERY);
  const [data, setData] = useState<BoardsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBoards(filter).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div>
      <ScoreFilters value={filter} onChange={setFilter} />
      {loading && !data ? (
        <p className="text-ink-soft mt-4">Loading boards…</p>
      ) : null}
      <div className="score-cards">
        {(data?.tracks ?? []).map((track) => (
          <div className="score-card" key={track.trackId}>
            <div className="score-card__head">
              <a className="score-card__title" href={playHref(track.trackId, "youtube")}>
                {track.title}
              </a>
              <span className="score-card__meta">{track.artist}</span>
            </div>
            <Leaderboard entries={track.board} />
          </div>
        ))}
      </div>
    </div>
  );
}
