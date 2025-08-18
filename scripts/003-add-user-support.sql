-- Add user-level support to generations for auth tracking
ALTER TABLE generations 
  ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

