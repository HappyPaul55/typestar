/**
 * A leaderboard table, shared by the song boards, the profile and the
 * challenges. Each player appears once, at their best.
 */

import type { LeaderboardEntry } from "../../lib/score/types";
import { useT } from "../../i18n/react";

export default function Leaderboard({
  entries,
  empty,
}: {
  entries: LeaderboardEntry[];
  empty?: string;
}) {
  const t = useT();
  if (entries.length === 0) {
    return <p className="score-empty">{empty ?? t("leaderboard.empty")}</p>;
  }
  return (
    <table className="score-table">
      <thead>
        <tr>
          <th>{t("leaderboard.rank")}</th>
          <th>{t("leaderboard.player")}</th>
          <th>{t("leaderboard.score")}</th>
          <th>{t("leaderboard.accuracy")}</th>
          <th>{t("leaderboard.combo")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr
            key={`${entry.rank}-${entry.handle ?? "anon"}`}
            data-you={entry.you ? "true" : undefined}
          >
            <td className="score-table__rank">{entry.rank}</td>
            <td>
              {entry.handle ? (
                <a href={`/u/${encodeURIComponent(entry.handle)}`}>
                  {entry.displayName || entry.handle}
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="score-table__score">
              {entry.score.toLocaleString("en-GB")}
            </td>
            <td>{Math.round(entry.accuracy * 100)}%</td>
            <td>×{entry.maxCombo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
