-- Adding proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_generations_artist_id ON generations(artist_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artists_name_search ON artists USING gin(to_tsvector('english', name));
