import { type NextRequest, NextResponse } from "next/server"
import { spotifyAPI } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const artists = await spotifyAPI.searchArtists(query, 8)
    return NextResponse.json(artists)
  } catch (error) {
    console.error("Artist search error:", error)
    return NextResponse.json({ error: "Failed to search artists" }, { status: 500 })
  }
}
