import { NextResponse, type NextRequest } from "next/server"
import { assertRapidApiEnv } from "@/lib/env"
import { analyzeTrackBySpotifyId, analyzeTrackByName } from "@/lib/trackAnalysis"

export async function GET(request: NextRequest) {
  try {
    assertRapidApiEnv()

    const { searchParams } = new URL(request.url)
    const spotifyId = searchParams.get("spotifyId") || undefined
    const title = searchParams.get("title") || undefined
    const artist = searchParams.get("artist") || undefined

    if (spotifyId) {
      const features = await analyzeTrackBySpotifyId(spotifyId)
      return NextResponse.json({ ok: true, via: "spotifyId", features })
    }
    // Title+artist path not yet supported until endpoint is confirmed

    return NextResponse.json(
      { ok: false, error: "Provide either ?spotifyId=TRACK_ID or ?title=...&artist=..." },
      { status: 400 },
    )
  } catch (error) {
    console.error("Track analysis test error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


