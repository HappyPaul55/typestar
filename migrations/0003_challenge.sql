-- The challenge history.
--
-- A period's song is not derived from the date: it is the most-played featured
-- track that has not been a challenge yet, so the pick depends on the score
-- table and has to be recorded for every server to agree on the same song.
-- One row per period, written lazily the first time the period is served.
--
-- `trackId`, `title` and `artist` are denormalised, like the `score` table, so
-- a recorded challenge still renders if the featured list later changes.

create table if not exists "challenge" (
  "id" text not null primary key,
  "trackId" text not null,
  "title" text not null,
  "artist" text not null,
  "createdAt" text not null
);

create index if not exists "challenge_track_idx"
  on "challenge" ("trackId");
