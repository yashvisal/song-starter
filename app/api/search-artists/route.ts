import { type NextRequest, NextResponse } from "next/server"
import { spotifyAPI } from "@/lib/spotify"
import { validateSearchQuery } from "@/lib/validation"
import { assertSpotifyEnv } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    assertSpotifyEnv()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    const { q } = validateSearchQuery(query)

    const artists = await spotifyAPI.searchArtists(q, 8)
    return NextResponse.json(artists)
  } catch (error) {
    console.error("Artist search error:", error)

    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to search artists" }, { status: 500 })
  }
}
