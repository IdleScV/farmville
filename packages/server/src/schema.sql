CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  coins         INTEGER     NOT NULL DEFAULT 100,
  level         INTEGER     NOT NULL DEFAULT 1,
  xp            INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_types (
  id              VARCHAR(30) PRIMARY KEY,
  name            VARCHAR(50) NOT NULL,
  emoji           VARCHAR(8)  NOT NULL,
  growth_seconds  INTEGER     NOT NULL,
  seed_cost       INTEGER     NOT NULL,
  harvest_yield   INTEGER     NOT NULL,
  xp_yield        INTEGER     NOT NULL DEFAULT 10,
  min_level       INTEGER     NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS plots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  x           SMALLINT    NOT NULL,
  y           SMALLINT    NOT NULL,
  state       VARCHAR(20) NOT NULL DEFAULT 'empty',
  crop_type   VARCHAR(30) REFERENCES crop_types(id),
  planted_at  TIMESTAMPTZ,
  UNIQUE(user_id, x, y)
);

-- Seed crops (safe to re-run)
INSERT INTO crop_types VALUES
  ('wheat',        'Wheat',       '🌾', 30,  10,  25,  5,  1),
  ('carrot',       'Carrot',      '🥕', 60,  15,  40,  8,  1),
  ('tomato',       'Tomato',      '🍅', 120, 25,  70,  15, 2),
  ('corn',         'Corn',        '🌽', 300, 40,  110, 25, 3),
  ('pumpkin',      'Pumpkin',     '🎃', 600, 60,  160, 40, 4),
  ('strawberry',   'Strawberry',  '🍓', 900, 90,  250, 60, 5)
ON CONFLICT (id) DO NOTHING;
