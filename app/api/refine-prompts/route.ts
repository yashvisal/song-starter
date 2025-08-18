import { type NextRequest, NextResponse } from "next/server"
import { refinePromptsWithUserFeedback } from "@/lib/llm"
import { getArtist, saveGeneration } from "@/lib/database"
import { validateRefineRequest } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { artistId, originalAnalysis, userAnswers } = validateRefineRequest(body)

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

    if (error instanceof Error && (error.message.includes("required") || error.message.includes("must be"))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to refine prompts" }, { status: 500 })
  }
}
