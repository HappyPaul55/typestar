/**
 * The public "recently played" feed: the latest verified scores across every
 * player, to encourage a bit of competition.
 */

import { useEffect, useState } from "react";
import { fetchRecent, type RecentEntry } from "../../lib/score/client";
import ScoreList from "./ScoreList";

export default function RecentFeed() {
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

  if (rows === null) return <p className="text-ink-soft">Loading recent scores…</p>;

  return (
    <ScoreList
      rows={rows}
      showPlayer
      empty="No scores yet — play a song and be the first on the board."
    />
  );
}
