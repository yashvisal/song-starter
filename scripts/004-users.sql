-- Basic users table to support fun usernames and ownership on generations
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index for case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users ((LOWER(username)));