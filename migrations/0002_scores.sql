-- Recorded scores.
--
-- One row per submitted run. The run's event timeline is replayed on the server
-- and then discarded; only the outcome is stored. A submission is never
-- rejected: an invalid one is kept with `valid = 0` and a reason, and boards
-- read only valid rows.
--
-- `userId` cascades from the Better Auth `user` table, so deleting an account
-- removes its scores too.

create table if not exists "score" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "trackId" text not null,
  "trackType" text not null,
  "title" text not null,
  "artist" text,
  "style" text not null,
  "difficulty" text not null,
  "runMode" text not null,
  "speed" real not null,
  "score" integer not null,
  "accuracy" real not null,
  "maxCombo" integer not null,
  "hits" integer not null,
  "misses" integer not null,
  "progress" real not null,
  "valid" integer not null default 1,
  "invalidReason" text,
  "scoreVersion" integer not null,
  "createdAt" text not null
);

create index if not exists "score_board_idx"
  on "score" ("trackId", "style", "difficulty", "runMode", "speed", "scoreVersion", "valid", "score");

create index if not exists "score_user_idx"
  on "score" ("userId", "createdAt");

create index if not exists "score_recent_idx"
  on "score" ("valid", "createdAt");
