/**
 * A list of recorded scores, used by the profile and the recent feed.
 */

import type { RecentEntry } from "../../lib/score/client";
import { modeLabel, playHref, timeAgo } from "../../lib/score/format";

export default function ScoreList({
  rows,
  showPlayer = false,
  empty = "Nothing yet.",
}: {
  rows: RecentEntry[];
  showPlayer?: boolean;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="score-empty">{empty}</p>;
  return (
    <table className="score-table">
      <thead>
        <tr>
          {showPlayer ? <th>Player</th> : null}
          <th>Song</th>
          <th>Mode</th>
          <th>Score</th>
          <th>When</th>
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
