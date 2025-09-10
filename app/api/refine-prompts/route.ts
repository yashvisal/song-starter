import { type NextRequest, NextResponse } from "next/server"
import { refinePromptsWithUserFeedback } from "@/lib/llm"
import { getArtist, saveGeneration, updateGenerationRefinement, getLatestGenerationByArtistAndUser } from "@/lib/database"
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
    // Try to resolve userId from body, then cookie
    let userId = typeof body?.userId === "string" ? body.userId : undefined
    const cookieHeader = request.headers.get("cookie") || ""
    const cookieUser = /suno_username=([^;]+)/.exec(cookieHeader)?.[1]
    // Prefer cookie for authoritative identity; fall back to body
    userId = cookieUser || userId

    const artist = await getArtist(artistId)
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    console.log("[refine] Calling LLM refine")
    const refinedPrompts = await refinePromptsWithUserFeedback(artist, originalAnalysis, userAnswers)

    // Persist: update existing row when generationId provided; else create new
    let generation
    if (generationId) {
      generation = await updateGenerationRefinement({
        generationId,
        refinedPrompts,
        userQuestions: userAnswers,
        generationMetadata: {
          analysisData: originalAnalysis,
          timestamp: new Date().toISOString(),
          processingTime: Date.now(),
          phase: "refined",
        },
        userId,
      })
    } else {
      // Best-effort: update an existing row for this user/artist to avoid duplicates
      const existing = await getLatestGenerationByArtistAndUser(artist.id, userId || null)
      if (existing?.id) {
        generation = await updateGenerationRefinement({
          generationId: existing.id,
          refinedPrompts,
          userQuestions: userAnswers,
          generationMetadata: {
            analysisData: originalAnalysis,
            timestamp: new Date().toISOString(),
            processingTime: Date.now(),
            phase: "refined",
          },
          userId,
        })
      } else {
        generation = await saveGeneration({
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
      }
    }

    console.log("[refine] Persisted refined prompts to DB", { id: generation.id })
    const response = NextResponse.json({ refinedPrompts, generationId: generation.id, generation })
    try {
      // Mark this generation as the current one for SSR hydrate without flicker
      response.cookies.set(`suno_last_gen_${artist.id}`, String(generation.id), { path: "/", maxAge: 60 * 60 * 24 * 30 })
      if (userId) {
        response.cookies.set("suno_username", userId, { path: "/", maxAge: 60 * 60 * 24 * 365 })
      }
    } catch {}
    return response
  } catch (error) {
    console.error("Prompt refinement error:", error)

    if (error instanceof Error && (error.message.includes("required") || error.message.includes("must be"))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to refine prompts" }, { status: 500 })
  }
}
