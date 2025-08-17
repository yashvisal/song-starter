import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { Artist, Generation } from "@/lib/types"

const DATA_DIR = path.join(process.cwd(), "data")
const ARTISTS_FILE = path.join(DATA_DIR, "artists.json")
const GENERATIONS_FILE = path.join(DATA_DIR, "generations.json")

async function loadData<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const [generations, artists] = await Promise.all([
      loadData<Generation>(GENERATIONS_FILE),
      loadData<Artist>(ARTISTS_FILE),
    ])

    // Filter by search if provided
    let filteredGenerations = generations
    if (search) {
      filteredGenerations = generations.filter((g) => {
        const artist = artists.find((a) => a.id === g.artistId)
        return artist?.name.toLowerCase().includes(search.toLowerCase())
      })
    }

    // Sort by creation date (newest first)
    const sortedGenerations = filteredGenerations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)

    // Add artist data to generations
    const formattedGenerations = sortedGenerations.map((g) => {
      const artist = artists.find((a) => a.id === g.artistId)
      return {
        id: g.id,
        artistId: g.artistId,
        userQuestions: g.userQuestions || [],
        originalPrompts: g.originalPrompts || [],
        refinedPrompts: g.refinedPrompts || [],
        generationMetadata: g.generationMetadata || {},
        createdAt: new Date(g.createdAt),
        artist: artist
          ? {
              id: artist.id,
              name: artist.name,
              imageUrl: artist.imageUrl,
              genres: artist.genres || [],
            }
          : undefined,
      }
    })

    return NextResponse.json(formattedGenerations)
  } catch (error) {
    console.error("Failed to fetch generations:", error)
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 })
  }
}
