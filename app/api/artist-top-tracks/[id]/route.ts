import { NextResponse, type NextRequest } from "next/server"
import { spotifyAPI } from "@/lib/spotify"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(10, Number.parseInt(limitParam))) : 8

    const tracks = await spotifyAPI.getArtistTopTracks(id)
    const selected = tracks
      .slice(0, limit)
      .map((t: any) => ({ id: t?.id as string, name: t?.name as string, popularity: t?.popularity as number }))

    return NextResponse.json({ tracks: selected })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


