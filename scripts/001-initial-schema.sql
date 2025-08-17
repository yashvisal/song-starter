-- Create initial database schema for Suno Producer
-- Artists table to cache Spotify artist data
CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  genres TEXT[], -- JSON array of genres
  popularity INTEGER,
  followers INTEGER,
  image_url TEXT,
  spotify_id TEXT UNIQUE NOT NULL,
  audio_features JSONB, -- Store all audio features as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generations table to store all prompt generations
CREATE TABLE IF NOT EXISTS generations (
  id SERIAL PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id),
  user_questions JSONB, -- Store Q&A responses
  original_prompts JSONB, -- First 10 prompts generated
  refined_prompts JSONB, -- Final 10 prompts after user feedback
  generation_metadata JSONB, -- Store analysis data, timestamps, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_artist_id ON generations(artist_id);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
