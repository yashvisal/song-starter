import { type NextRequest, NextResponse } from "next/server"
import { refinePromptsWithUserFeedback } from "@/lib/llm"
import { getArtist, saveGeneration } from "@/lib/database"
import { validateRefineRequest } from "@/lib/validation"
import { assertOpenAIEnv, assertDatabaseEnv } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    // Minimal env assertions for this endpoint
    assertDatabaseEnv()
    assertOpenAIEnv()

    const body = await request.json()

    const { artistId, originalAnalysis, userAnswers } = validateRefineRequest(body)
    const userId = typeof body?.userId === "string" ? body.userId : undefined

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const refinedPrompts = await refinePromptsWithUserFeedback(artist, originalAnalysis, userAnswers)

    // Save the generation to database
    const generation = await saveGeneration({
      artistId: artist.id,
      userId,
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
