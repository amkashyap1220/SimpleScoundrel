-- Every game the server dealt. The seed stays here, so a score can only be
-- saved for a game this server started, and only once.
CREATE TABLE games (
  id         TEXT PRIMARY KEY,
  seed       TEXT NOT NULL,
  created_at TEXT NOT NULL,          -- ISO time
  scored     INTEGER NOT NULL DEFAULT 0
);

-- The high scores.
CREATE TABLE scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id    TEXT NOT NULL UNIQUE REFERENCES games(id),
  name       TEXT NOT NULL,
  score      INTEGER NOT NULL,
  won        INTEGER NOT NULL,
  created_at TEXT NOT NULL           -- ISO time
);

CREATE INDEX scores_by_score ON scores (score DESC, created_at ASC);
