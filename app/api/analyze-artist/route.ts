import { type NextRequest, NextResponse } from "next/server"
import { analyzeArtistAndGeneratePrompts } from "@/lib/llm"
import { getArtist } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { artistId } = await request.json()

    if (!artistId) {
      return NextResponse.json({ error: "Artist ID is required" }, { status: 400 })
    }

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const analysis = await analyzeArtistAndGeneratePrompts(artist)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Artist analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze artist" }, { status: 500 })
  }
}
