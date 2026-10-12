/**
 * A list of recorded scores, used by the profile and the recent feed.
 */

import type { RecentEntry } from "../../lib/score/client";
import { modeLabel, playHref, timeAgo } from "../../lib/score/format";
import { localePath } from "../../i18n/paths";
import { useT, useLocale } from "../../i18n/react";

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
  const locale = useLocale();
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
                  <a href={localePath(locale, `/u/${encodeURIComponent(row.handle)}`)}>
                    {row.displayName || row.handle}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            ) : null}
            <td>
              <a href={playHref(row.trackId, row.trackType, locale)}>{row.title}</a>
            </td>
            <td className="score-card__meta">{modeLabel(row, t)}</td>
            <td className="score-table__score">{row.score.toLocaleString("en-GB")}</td>
            <td>{timeAgo(row.createdAt, t, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
