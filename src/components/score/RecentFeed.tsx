/**
 * The public "recently played" feed: the latest verified scores across every
 * player, to encourage a bit of competition.
 */

import { useEffect, useState } from "react";
import { fetchRecent, type RecentEntry } from "../../lib/score/client";
import { useT, withLocale } from "../../i18n/react";
import ScoreList from "./ScoreList";

function RecentFeed() {
  const t = useT();
  const [rows, setRows] = useState<RecentEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecent(50).then((recent) => {
      if (!cancelled) setRows(recent);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) return <p className="text-ink-soft">{t("recent.loading")}</p>;

  return <ScoreList rows={rows} showPlayer empty={t("recent.empty")} />;
}

export default withLocale(RecentFeed);
