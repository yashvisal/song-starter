import { type NextRequest, NextResponse } from "next/server"
import { refinePromptsWithUserFeedback } from "@/lib/llm"
import { getArtist, saveGeneration } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { artistId, originalAnalysis, userAnswers } = await request.json()

    if (!artistId || !originalAnalysis || !userAnswers) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const refinedPrompts = await refinePromptsWithUserFeedback(artist, originalAnalysis, userAnswers)

    // Save the generation to database
    const generation = await saveGeneration({
      artistId: artist.id,
      userQuestions: userAnswers,
      originalPrompts: originalAnalysis.initialPrompts,
      refinedPrompts,
      generationMetadata: {
        analysisData: originalAnalysis,
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
      },
    })

    return NextResponse.json({ refinedPrompts, generationId: generation.id })
  } catch (error) {
    console.error("Prompt refinement error:", error)
    return NextResponse.json({ error: "Failed to refine prompts" }, { status: 500 })
  }
}
