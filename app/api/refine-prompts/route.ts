import { type NextRequest, NextResponse } from "next/server"
import { refinePromptsWithUserFeedback } from "@/lib/llm"
import { getArtist, saveGeneration, updateGenerationRefinement } from "@/lib/database"
import { validateRefineRequest } from "@/lib/validation"
import { assertOpenAIEnv, assertDatabaseEnv } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    // Minimal env assertions for this endpoint
    assertDatabaseEnv()
    assertOpenAIEnv()

    const body = await request.json()

    const { artistId, originalAnalysis, userAnswers } = validateRefineRequest(body)
    const generationId = typeof (body as any)?.generationId === "number" ? (body as any).generationId : undefined
    const userId = typeof body?.userId === "string" ? body.userId : undefined

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const refinedPrompts = await refinePromptsWithUserFeedback(artist, originalAnalysis, userAnswers)

    // Persist: update existing row when generationId provided; else create new
    const generation = generationId
      ? await updateGenerationRefinement({
          generationId,
          refinedPrompts,
          userQuestions: userAnswers,
          generationMetadata: {
            analysisData: originalAnalysis,
            timestamp: new Date().toISOString(),
            processingTime: Date.now(),
            phase: "refined",
          },
        })
      : await saveGeneration({
          artistId: artist.id,
          userId,
          userQuestions: userAnswers,
          originalPrompts: originalAnalysis.initialPrompts,
          refinedPrompts,
          generationMetadata: {
            analysisData: originalAnalysis,
            timestamp: new Date().toISOString(),
            processingTime: Date.now(),
            phase: "refined",
          },
        })

    return NextResponse.json({ refinedPrompts, generationId: generation.id, generation })
  } catch (error) {
    console.error("Prompt refinement error:", error)

    if (error instanceof Error && (error.message.includes("required") || error.message.includes("must be"))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to refine prompts" }, { status: 500 })
  }
}
