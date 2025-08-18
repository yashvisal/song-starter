import { neon } from "@neondatabase/serverless"
import type { Artist, Generation, AudioFeatures } from "./types"
import { v4 as uuidv4 } from "uuid"

const sql = neon(process.env.DATABASE_URL!)

export async function saveArtist(artistData: {
  spotifyId: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  imageUrl: string
  audioFeatures: AudioFeatures
}): Promise<Artist> {
  const now = new Date()
  const id = uuidv4()

  const result = await sql`
    INSERT INTO artists (
      id, spotify_id, name, genres, popularity, followers, image_url, audio_features, created_at, updated_at
    ) VALUES (
      ${id}, ${artistData.spotifyId}, ${artistData.name}, ${artistData.genres}, 
      ${artistData.popularity}, ${artistData.followers}, ${artistData.imageUrl}, 
      ${JSON.stringify(artistData.audioFeatures)}, ${now}, ${now}
    )
    ON CONFLICT (spotify_id) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      genres = EXCLUDED.genres,
      popularity = EXCLUDED.popularity,
      followers = EXCLUDED.followers,
      image_url = EXCLUDED.image_url,
      audio_features = EXCLUDED.audio_features,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  const artist = result[0]
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    followers: artist.followers,
    imageUrl: artist.image_url,
    spotifyId: artist.spotify_id,
    audioFeatures: artist.audio_features,
    createdAt: artist.created_at,
    updatedAt: artist.updated_at,
  }
}

export async function getArtist(spotifyId: string): Promise<Artist | null> {
  const result = await sql`
    SELECT * FROM artists WHERE spotify_id = ${spotifyId}
  `

  if (result.length === 0) return null

  const artist = result[0]
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    followers: artist.followers,
    imageUrl: artist.image_url,
    spotifyId: artist.spotify_id,
    audioFeatures: artist.audio_features,
    createdAt: artist.created_at,
    updatedAt: artist.updated_at,
  }
}

export async function saveGeneration(generationData: {
  artistId: string
  userQuestions: any[]
  originalPrompts: string[]
  refinedPrompts: string[]
  generationMetadata: any
}): Promise<Generation> {
  const now = new Date()

  const result = await sql`
    INSERT INTO generations (
      artist_id, user_questions, original_prompts, refined_prompts, generation_metadata, created_at
    ) VALUES (
      ${generationData.artistId}, ${JSON.stringify(generationData.userQuestions)}, 
      ${JSON.stringify(generationData.originalPrompts)}, ${JSON.stringify(generationData.refinedPrompts)}, 
      ${JSON.stringify(generationData.generationMetadata)}, ${now}
    )
    RETURNING *
  `

  const generation = result[0]
  return {
    id: Number(generation.id),
    artistId: generation.artist_id,
    userQuestions: generation.user_questions,
    originalPrompts: generation.original_prompts,
    refinedPrompts: generation.refined_prompts,
    generationMetadata: generation.generation_metadata,
    createdAt: new Date(generation.created_at),
  }
}

export async function getRecentGenerations(limit = 10): Promise<Generation[]> {
  const result = await sql`
    SELECT 
      g.*,
      a.name as artist_name,
      a.image_url as artist_image_url,
      a.genres as artist_genres
    FROM generations g
    LEFT JOIN artists a ON g.artist_id = a.id
    ORDER BY g.created_at DESC
    LIMIT ${limit}
  `

  return result.map((row) => ({
    id: Number(row.id),
    artistId: row.artist_id,
    userQuestions: row.user_questions || [],
    originalPrompts: row.original_prompts || [],
    refinedPrompts: row.refined_prompts || [],
    generationMetadata: row.generation_metadata || {},
    createdAt: new Date(row.created_at),
    artist: row.artist_name
      ? {
          id: row.artist_id,
          name: row.artist_name,
          imageUrl: row.artist_image_url,
          genres: row.artist_genres || [],
        }
      : undefined,
  }))
}
