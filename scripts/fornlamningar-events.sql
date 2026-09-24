-- The sync log for the fornlämningar app. Run once against the database.
--
--   node scripts/apply-fl-schema.cjs
--
-- Against the database this project already has, not a new one. Every table
-- here is prefixed `fl_` so it sits beside the other app's tables without
-- touching them. Use the NON-pooled url for DDL: a pooler can route the
-- statements of one script to different sessions.
--
-- One append-only table plus a counter row. Everything a user contributes is
-- an event; the app replays them into its local SQLite. Nothing here is ever
-- updated or deleted, so a retraction is itself an event
-- ('comment_delete') -- otherwise a phone that was offline when a comment
-- was written and deleted would never learn that either happened.

-- gen_random_bytes, used for the salt at the bottom of this file, lives in
-- pgcrypto. gen_random_uuid() is core since Postgres 13; gen_random_bytes is
-- not, and the difference only shows up as an error on a fresh database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS fl_events (
  seq        BIGINT      PRIMARY KEY,
  event_id   UUID        NOT NULL UNIQUE,
  kind       TEXT        NOT NULL,
  place_uuid TEXT        NOT NULL,
  author     TEXT        NOT NULL,
  payload    JSONB       NOT NULL,
  -- The phone's own clock, kept as data and never used for ordering.
  client_ts  TIMESTAMPTZ,
  server_ts  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Salted hash, not the address: enough to rate limit, not a record of
  -- where a person was.
  ip_hash    TEXT
);

CREATE INDEX IF NOT EXISTS fl_events_place ON fl_events (place_uuid, seq);
CREATE INDEX IF NOT EXISTS fl_events_author ON fl_events (author, server_ts DESC);
CREATE INDEX IF NOT EXISTS fl_events_rate ON fl_events (ip_hash, server_ts DESC);

-- WHY A COUNTER ROW AND NOT bigserial.
--
-- A sequence hands out its number BEFORE the transaction commits, so two
-- concurrent writers can commit out of order: tx A takes 10 and is slow, tx B
-- takes 11 and commits first. A reader sees 11, stores that as its cursor,
-- and when A finally commits, event 10 is behind the cursor and will never be
-- read by anyone. Silent, permanent data loss, and the whole point of this
-- design was not to lose events.
--
-- Incrementing a single row inside the same transaction takes a row lock, so
-- B cannot get 11 until A has committed. The order of the numbers becomes the
-- order of the commits, which is what makes `seq > since` correct. The cost
-- is that writers serialise on one row; at a few writes per second that is
-- free, and this app will not see a few writes per second for years.
--
-- GAPS ARE EXPECTED AND HARMLESS. A phone that resends an event it already
-- sent -- which the outbox does whenever a response is lost -- consumes a
-- number without inserting a row, because the insert is ON CONFLICT DO
-- NOTHING. A reader asks for `seq > cursor` and a number with no row behind
-- it simply returns nothing, so a gap costs one integer and nothing else. It
-- is not a lost event, which is what it looks like at first glance.
CREATE TABLE IF NOT EXISTS fl_event_seq (
  id BIGINT PRIMARY KEY CHECK (id = 1),
  v  BIGINT NOT NULL
);
INSERT INTO fl_event_seq (id, v) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Accounts, once sign-in exists. `id` is the Firebase uid.
CREATE TABLE IF NOT EXISTS fl_accounts (
  id         TEXT PRIMARY KEY,
  provider   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_ids TEXT[] NOT NULL DEFAULT '{}'
);

-- Which anonymous device ids belong to which account.
--
-- This used to be the `device_ids` array on fl_accounts above, and it is a
-- table now because the query that matters runs the other way. Every read of
-- the feed has to turn an event's author into the pseudonym its account
-- shares, so the lookup is device -> account, on every distinct author in the
-- window. An array needs a scan for that; a primary key does not. The column
-- is dropped below rather than kept in step, because two places holding one
-- fact is two places that can disagree.
--
-- THE DEVICE IS THE PRIMARY KEY, so a device belongs to at most one account,
-- while an account may hold many devices. Signing in on a second phone adds a
-- row; it never moves an event. That is what keeps the log append-only: the
-- events made before signing in keep the author they were written with, and
-- the grouping happens at read time.
--
-- THIS TABLE IS NEVER SERVED. It maps a public account id to a device id, and
-- the device id is a write credential -- publishing the link would undo the
-- pseudonym entirely. It exists only to be joined against, server-side.
CREATE TABLE IF NOT EXISTS fl_account_devices (
  device    TEXT PRIMARY KEY,
  account   TEXT NOT NULL REFERENCES fl_accounts(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fl_account_devices_account
  ON fl_account_devices(account);

ALTER TABLE fl_accounts DROP COLUMN IF EXISTS device_ids;

-- A place for values the code needs and nobody should have to set.
--
-- `ip_salt` exists so a request can be counted without the address being
-- recoverable: an unsalted hash of an IPv4 address is reversible by trying
-- all four billion of them, which makes it a record of where somebody was
-- rather than a counter. Generating it here rather than as an environment
-- variable means there is no secret to hand around, nothing to forget when
-- the project moves, and no deploy that silently loses rate limiting because
-- a variable was not copied.
CREATE TABLE IF NOT EXISTS fl_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO fl_config (key, value)
VALUES ('ip_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- The salt that turns an author id into the pseudonym other clients see.
--
-- IT MUST NEVER CHANGE once events exist. Unlike ip_salt, which only has to
-- make two requests from one address group together for an hour, this value
-- decides identity: rotate it and every reader's idea of who said what is
-- reset, so "one vote per author" silently starts counting old and new
-- pseudonyms as two different people.
--
-- Generated here rather than read from an environment variable, for the same
-- reason as ip_salt: there is nothing to copy between environments, nothing
-- to forget, and no value that exists outside the database it protects.
INSERT INTO fl_config (key, value)
VALUES ('author_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- fl_reports: somebody telling us that something published here is wrong.
--
-- THIS IS THE OBLIGATORY HALF. Comments are post-moderated, which EU hosting
-- law allows -- the safe harbour (DSA art. 6) turns on acting expeditiously
-- once you have actual knowledge, not on reading everything first. What it
-- does NOT make optional is art. 16: a hosting service must offer a way for
-- anyone to notify it of illegal content, and that duty has no
-- micro-enterprise exemption. Without this, "we take it down when told" has
-- no channel to be told through.
--
-- NOT IN fl_events, and that is the distinction the whole log rests on.
-- fl_events holds what somebody PUBLISHED: rows every phone replicates,
-- because they are things other visitors need. A report is addressed to us,
-- it names a person, and it must reach nobody else -- publishing "this
-- comment was reported" would hand every device a way to smear a
-- contribution with no decision behind it.
--
-- NO ACCOUNT REQUIRED, deliberately, and unlike commenting. Requiring
-- somebody to sign up before they can tell you about illegal content would
-- defeat the point of the duty; a report costs us a read and nothing else,
-- so the worst an abuser gets is our attention.
--
-- `reporter` is the device id, kept so repeat reports from one device can be
-- recognised and so a report can be withdrawn. It is never served: like
-- every author id in this schema it is a write credential.
CREATE TABLE IF NOT EXISTS fl_reports (
  id         BIGSERIAL PRIMARY KEY,
  -- What is being reported. 'comment' today; 'photo' and 'place' when they
  -- exist, which is why this is a column and not implied by the table.
  kind       TEXT NOT NULL,
  -- The event being reported, when there is one.
  target     UUID,
  place_uuid TEXT,
  reporter   TEXT NOT NULL,
  -- A small fixed set, so a report can be counted and sorted rather than
  -- only read. The free text is separate and optional.
  reason     TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- When a human decided. NULL means it is still waiting, which is the only
  -- query this table really has to answer.
  handled_at TIMESTAMPTZ,
  -- One report per device per target: a second tap is the same report, and
  -- counting distinct reporters is the only thing the number is good for.
  UNIQUE (reporter, kind, target)
);
CREATE INDEX IF NOT EXISTS fl_reports_open
  ON fl_reports (created_at DESC) WHERE handled_at IS NULL;

-- Comments a moderator has accepted.
--
-- Accepting does not publish anything and does not hide the comment from
-- visitors. It records that this person has seen it, so the moderation feed
-- can stop showing it. An open report brings it back: the feed shows a
-- comment when it has not been accepted, or when a report is still waiting.
-- Not an event, for the same reason a report is not an event: phones have
-- nothing to replicate. The comment was already published.
CREATE TABLE IF NOT EXISTS fl_comment_accept (
  event_id    UUID PRIMARY KEY,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Photos waiting for a person to look at them.
--
-- They are NOT in fl_events yet. A photo in the public log is a photo every
-- phone will show, and an image has to be reviewed before that happens.
-- Approving inserts the row into fl_events (and only then does it get a
-- seq); rejecting deletes it here. The file itself is in Firebase Storage,
-- not in this table.
CREATE TABLE IF NOT EXISTS fl_photo_queue (
  event_id   UUID        PRIMARY KEY,
  place_uuid TEXT        NOT NULL,
  author     TEXT        NOT NULL,
  payload    JSONB       NOT NULL,
  client_ts  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What each published description was written from.
--
-- A copy of the pipeline's `sources` table in places.sqlite, cut to the
-- places a release carries, so a moderator looking at a bad description can
-- see what the model was given without the laptop that built it. The
-- pipeline is the owner; this is replaced wholesale by
-- scripts/load-fl-sources.cjs and nothing here writes to it.
--
-- Keyed by (place_uuid, source_id) and not by source_id: a source belongs to
-- a cluster, and `place_uuid` is the uuid the release published the cluster
-- under, which is the id the admin page and the phone both have.
--
-- `used` is the pipeline's generation_sources: the rows that went into the
-- Swedish prompt. A source that is here and not used is one the payload
-- trimmed, which is itself worth seeing.
CREATE TABLE IF NOT EXISTS fl_sources (
  place_uuid  TEXT    NOT NULL,
  source_id   BIGINT  NOT NULL,
  cluster_id  TEXT    NOT NULL,
  kind        TEXT    NOT NULL,
  lang        TEXT,
  title       TEXT,
  body        TEXT    NOT NULL,
  author      TEXT,
  publisher   TEXT,
  licence     TEXT,
  licence_url TEXT,
  url         TEXT,
  trust       REAL,
  used        BOOLEAN NOT NULL DEFAULT false,
  fetched_at  TEXT,
  generation  INTEGER NOT NULL,
  PRIMARY KEY (place_uuid, source_id)
);

-- Sources a person added by hand, which the pipeline did not find.
--
-- Hunehals is the case this is for: sv.wikipedia has the article, and
-- nothing links it to the register -- no Wikidata sitelink, no list entry
-- -- so no crawl ever will. The pipeline reads this table
-- (scripts/export-fl-added-sources.cjs -> build_sources.py) and from then
-- on the row is an ordinary source in places.sqlite, and so in fl_sources.
--
-- Its own table and not rows in fl_sources, because fl_sources is replaced
-- wholesale on every release load and a hand-added row there would be gone
-- the next time.
--
-- `added_by` is the admin's uid today. The endpoint is written so a
-- signed-in visitor can use it later; `status` is what keeps that safe --
-- anything not from an admin would arrive 'pending'.
CREATE TABLE IF NOT EXISTS fl_sources_added (
  id          BIGSERIAL PRIMARY KEY,
  place_uuid  TEXT        NOT NULL,
  kind        TEXT        NOT NULL,
  lang        TEXT,
  title       TEXT,
  body        TEXT        NOT NULL,
  publisher   TEXT,
  licence     TEXT,
  licence_url TEXT,
  url         TEXT,
  added_by    TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS fl_sources_added_place
  ON fl_sources_added (place_uuid);
