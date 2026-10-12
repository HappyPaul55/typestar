/**
 * A public profile at `/u/<handle>`: aggregate stats, best scores and recent
 * runs. The handle is read from the URL, so the page stays static.
 */

import { useEffect, useState } from "react";
import { fetchProfile, type ProfileResponse } from "../../lib/score/client";
import ScoreList from "./ScoreList";

type State = "loading" | "ready" | "missing";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-stat">
      <span className="score-stat__label">{label}</span>
      <span className="score-stat__value">{value}</span>
    </div>
  );
}

export default function ProfileView() {
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    const match = /^\/u\/([^/]+)\/?$/.exec(window.location.pathname);
    const handle = match ? decodeURIComponent(match[1]) : null;
    if (!handle) {
      setState("missing");
      return;
    }
    let cancelled = false;
    fetchProfile(handle).then((result) => {
      if (cancelled) return;
      if (!result) {
        setState("missing");
        return;
      }
      setData(result);
      setState("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return <p className="text-ink-soft">Loading profile…</p>;
  if (state === "missing" || !data) {
    return <p className="text-ink-soft">No player with that handle.</p>;
  }

  const name = data.profile.displayName || data.profile.handle || "Player";
  const since = data.profile.createdAt
    ? new Date(data.profile.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <p className="comment">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        profile
      </p>
      <h2 className="panel__title mt-2">{name}</h2>
      <p className="score-card__meta mt-1">
        {data.profile.handle ? `@${data.profile.handle}` : "player"}
        {since ? ` · joined ${since}` : ""}
      </p>

      <div className="score-stats">
        <Stat label="plays" value={data.stats.plays.toLocaleString("en-GB")} />
        <Stat label="songs" value={data.stats.tracks.toLocaleString("en-GB")} />
        <Stat label="best" value={data.stats.bestScore.toLocaleString("en-GB")} />
      </div>

      <p className="group-label">Best scores</p>
      <ScoreList rows={data.bests} empty="No verified scores yet." />

      <p className="group-label">Recent</p>
      <ScoreList rows={data.recent} />
    </div>
  );
}
