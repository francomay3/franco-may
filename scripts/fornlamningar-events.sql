-- The sync log for the fornlämningar app. Run once against the database.
--
-- One append-only table plus a counter row. Everything a user contributes is
-- an event; the app replays them into its local SQLite. Nothing here is ever
-- updated or deleted, so a retraction is itself an event
-- ('comment_delete') -- otherwise a phone that was offline when a comment
-- was written and deleted would never learn that either happened.

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
CREATE TABLE IF NOT EXISTS fl_event_seq (
  id BIGINT PRIMARY KEY CHECK (id = 1),
  v  BIGINT NOT NULL
);
INSERT INTO fl_event_seq (id, v) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Accounts, once sign-in exists. `device_ids` is the list of anonymous ids
-- this account has adopted, which is how contributions made before signing
-- in keep belonging to the person who made them.
CREATE TABLE IF NOT EXISTS fl_accounts (
  id         TEXT PRIMARY KEY,
  provider   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_ids TEXT[] NOT NULL DEFAULT '{}'
);
