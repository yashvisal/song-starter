import { NextResponse, type NextRequest } from "next/server"
import { getLatestGenerationByArtistAndUser } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get("artistId") || ""
    // Prefer cookie-based username to align with refine persistence
    const cookieHeader = request.headers.get("cookie") || ""
    const cookieUser = /suno_username=([^;]+)/.exec(cookieHeader)?.[1]
    const userParam = searchParams.get("user") || undefined
    // Prefer cookie identity; fall back to query param for legacy clients
    const userId = cookieUser || userParam || undefined
    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 })
    }
    // Enforce user-scoped cache: if userId is missing, do not fall back to global
    if (!userId) {
      return NextResponse.json(null)
    }
    console.log("[gen/latest] Fetching from DB", { artistId, userId })
    const gen = await getLatestGenerationByArtistAndUser(artistId, userId)
    if (gen) {
      console.log("[gen/latest] DB hit", {
        id: gen.id,
        hasRefined: Array.isArray(gen.refinedPrompts) && gen.refinedPrompts.length > 0,
      })
      const response = NextResponse.json({
        id: gen.id,
        artistId: gen.artistId,
        userId: gen.userId,
        userQuestions: gen.userQuestions,
        originalPrompts: gen.originalPrompts,
        refinedPrompts: gen.refinedPrompts,
        generationMetadata: gen.generationMetadata,
        createdAt: gen.createdAt,
      })
      // If client passed user via query param but cookie is missing, set cookie for SSR consistency
      if (!cookieUser && userParam) {
        response.cookies.set("suno_username", userParam, { path: "/", maxAge: 60 * 60 * 24 * 365 })
      }
      return response
    } else {
      console.log("[gen/latest] DB miss")
      const response = NextResponse.json(null)
      if (!cookieUser && userParam) {
        response.cookies.set("suno_username", userParam, { path: "/", maxAge: 60 * 60 * 24 * 365 })
      }
      return response
    }
  } catch (error) {
    console.error("Failed to fetch latest generation:", error)
    return NextResponse.json({ error: "Failed to fetch generation" }, { status: 500 })
  }
}