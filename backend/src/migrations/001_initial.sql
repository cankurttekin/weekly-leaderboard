CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(24) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_username_trgm ON players USING gin (username gin_trgm_ops);

CREATE TABLE IF NOT EXISTS weekly_earnings (
  id          BIGSERIAL PRIMARY KEY,
  player_id   UUID NOT NULL REFERENCES players(id),
  week_id     INTEGER NOT NULL,
  earnings    BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, week_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_earnings_week ON weekly_earnings (week_id, earnings DESC);

CREATE TABLE IF NOT EXISTS weekly_pools (
  id              BIGSERIAL PRIMARY KEY,
  week_id         INTEGER NOT NULL UNIQUE,
  total_earnings  BIGINT NOT NULL DEFAULT 0,
  pool_amount     BIGINT NOT NULL DEFAULT 0,
  distributed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  distributed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payouts (
  id            BIGSERIAL PRIMARY KEY,
  week_id       INTEGER NOT NULL,
  player_id     UUID NOT NULL REFERENCES players(id),
  rank          SMALLINT NOT NULL,
  earnings      BIGINT NOT NULL,
  share_pct     NUMERIC(5,2) NOT NULL,
  prize_amount  BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_week ON payouts (week_id, rank);
