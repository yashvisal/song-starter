import { type NextRequest, NextResponse } from "next/server"
import { analyzeArtistAndGeneratePrompts } from "@/lib/llm"
import { getArtist } from "@/lib/database"
import { validateAnalyzeRequest } from "@/lib/validation"
import { assertOpenAIEnv, assertDatabaseEnv } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    // Minimal env assertions for this endpoint
    assertDatabaseEnv()
    assertOpenAIEnv()

    const body = await request.json()

    const { artistId } = validateAnalyzeRequest(body)

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const analysis = await analyzeArtistAndGeneratePrompts(artist)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Artist analysis error:", error)

    if (error instanceof Error && (error.message.includes("required") || error.message.includes("invalid"))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to analyze artist" }, { status: 500 })
  }
}
