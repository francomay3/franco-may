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
