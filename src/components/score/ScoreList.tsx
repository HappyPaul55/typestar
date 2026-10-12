/**
 * A list of recorded scores, used by the profile and the recent feed.
 */

import type { RecentEntry } from "../../lib/score/client";
import { modeLabel, playHref, timeAgo } from "../../lib/score/format";
import { useT } from "../../i18n/react";

export default function ScoreList({
  rows,
  showPlayer = false,
  empty,
}: {
  rows: RecentEntry[];
  showPlayer?: boolean;
  empty?: string;
}) {
  const t = useT();
  if (rows.length === 0) return <p className="score-empty">{empty ?? t("profile.nothing")}</p>;
  return (
    <table className="score-table">
      <thead>
        <tr>
          {showPlayer ? <th>{t("leaderboard.player")}</th> : null}
          <th>{t("score.song")}</th>
          <th>{t("score.mode")}</th>
          <th>{t("leaderboard.score")}</th>
          <th>{t("score.when")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.trackId}-${row.createdAt}-${index}`}>
            {showPlayer ? (
              <td>
                {row.handle ? (
                  <a href={`/u/${encodeURIComponent(row.handle)}`}>
                    {row.displayName || row.handle}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            ) : null}
            <td>
              <a href={playHref(row.trackId, row.trackType)}>{row.title}</a>
            </td>
            <td className="score-card__meta">{modeLabel(row)}</td>
            <td className="score-table__score">{row.score.toLocaleString("en-GB")}</td>
            <td>{timeAgo(row.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
