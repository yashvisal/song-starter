import { promises as fs } from "fs"
import path from "path"
import type { Artist, Generation, AudioFeatures } from "./types"

// Simple file-based storage for demo purposes
const DATA_DIR = path.join(process.cwd(), "data")
const ARTISTS_FILE = path.join(DATA_DIR, "artists.json")
const GENERATIONS_FILE = path.join(DATA_DIR, "generations.json")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Load data from JSON file
async function loadData<T>(filePath: string): Promise<T[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Save data to JSON file
async function saveData<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

export async function saveArtist(artistData: {
  spotifyId: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  imageUrl: string
  audioFeatures: AudioFeatures
}): Promise<Artist> {
  const artists = await loadData<Artist>(ARTISTS_FILE)
  const id = `artist_${artistData.spotifyId}`

  const existingIndex = artists.findIndex((a) => a.spotifyId === artistData.spotifyId)
  const now = new Date()

  const artist: Artist = {
    id,
    name: artistData.name,
    genres: artistData.genres,
    popularity: artistData.popularity,
    followers: artistData.followers,
    imageUrl: artistData.imageUrl,
    spotifyId: artistData.spotifyId,
    audioFeatures: artistData.audioFeatures,
    createdAt: existingIndex >= 0 ? artists[existingIndex].createdAt : now,
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    artists[existingIndex] = artist
  } else {
    artists.push(artist)
  }

  await saveData(ARTISTS_FILE, artists)
  return artist
}

export async function getArtist(spotifyId: string): Promise<Artist | null> {
  const artists = await loadData<Artist>(ARTISTS_FILE)
  const artist = artists.find((a) => a.spotifyId === spotifyId)

  if (!artist) return null

  // Convert date strings back to Date objects
  return {
    ...artist,
    createdAt: new Date(artist.createdAt),
    updatedAt: new Date(artist.updatedAt),
  }
}

export async function saveGeneration(generationData: {
  artistId: string
  userQuestions: any[]
  originalPrompts: string[]
  refinedPrompts: string[]
  generationMetadata: any
}): Promise<Generation> {
  const generations = await loadData<Generation>(GENERATIONS_FILE)

  const generation: Generation = {
    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    artistId: generationData.artistId,
    userQuestions: generationData.userQuestions,
    originalPrompts: generationData.originalPrompts,
    refinedPrompts: generationData.refinedPrompts,
    generationMetadata: generationData.generationMetadata,
    createdAt: new Date(),
  }

  generations.push(generation)
  await saveData(GENERATIONS_FILE, generations)

  return generation
}

export async function getRecentGenerations(limit = 10): Promise<Generation[]> {
  const [generations, artists] = await Promise.all([
    loadData<Generation>(GENERATIONS_FILE),
    loadData<Artist>(ARTISTS_FILE),
  ])

  // Sort by creation date (newest first)
  const sortedGenerations = generations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  // Add artist data to generations
  return sortedGenerations.map((g) => {
    const artist = artists.find((a) => a.id === g.artistId)
    return {
      ...g,
      createdAt: new Date(g.createdAt),
      artist: artist
        ? {
            id: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl,
          }
        : undefined,
    }
  })
}
