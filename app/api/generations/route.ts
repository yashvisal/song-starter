import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { validateGenerationsQuery } from "@/lib/validation"
import { getLatestGenerationByArtistAndUser, updateGenerationRefinement } from "@/lib/database"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { search, limit: limitStr, offset: offsetStr } = validateGenerationsQuery(searchParams)
    const userOnly = searchParams.get("user") || undefined

    const limit = limitStr ? Number.parseInt(limitStr) : 15
    const offset = offsetStr ? Number.parseInt(offsetStr) : 0

    let result
    try {
      if (search || userOnly) {
        result = await sql`
          SELECT 
            g.*,
            a.name as artist_name,
            a.image_url as artist_image_url,
            a.genres as artist_genres,
            a.spotify_id as artist_spotify_id,
            COUNT(*) OVER() as total_count
          FROM generations g
          LEFT JOIN artists a ON g.artist_id = a.id
          WHERE 
            (${search ? sql`LOWER(a.name) LIKE LOWER(${"%" + search + "%"})` : sql`TRUE`}) AND
            (${userOnly ? sql`g.user_id = ${userOnly}` : sql`TRUE`})
          ORDER BY g.created_at DESC 
          LIMIT ${limit} 
          OFFSET ${offset}
        `
      } else {
        result = await sql`
          SELECT 
            g.*,
            a.name as artist_name,
            a.image_url as artist_image_url,
            a.genres as artist_genres,
            a.spotify_id as artist_spotify_id,
            COUNT(*) OVER() as total_count
          FROM generations g
          LEFT JOIN artists a ON g.artist_id = a.id
          ORDER BY g.created_at DESC 
          LIMIT ${limit} 
          OFFSET ${offset}
        `
      }
    } catch (e: any) {
      // Fallback if user_id column doesn't exist yet
      if (String(e?.message || e).includes("user_id")) {
        result = await sql`
          SELECT 
            g.*,
            a.name as artist_name,
            a.image_url as artist_image_url,
            a.genres as artist_genres,
            a.spotify_id as artist_spotify_id,
            COUNT(*) OVER() as total_count
          FROM generations g
          LEFT JOIN artists a ON g.artist_id = a.id
          ${search ? sql`WHERE LOWER(a.name) LIKE LOWER(${"%" + search + "%"})` : sql``}
          ORDER BY g.created_at DESC 
          LIMIT ${limit} 
          OFFSET ${offset}
        `
      } else {
        throw e
      }
    }

    const totalCount = result?.[0]?.total_count ? Number(result[0].total_count) : undefined
    const formattedGenerations = result.map((row) => ({
      id: Number(row.id),
      artistId: row.artist_id,
      userId: row.user_id,
      userQuestions: row.user_questions || [],
      originalPrompts: row.original_prompts || [],
      refinedPrompts: row.refined_prompts || [],
      generationMetadata: row.generation_metadata || {},
      createdAt: new Date(row.created_at),
      artist: row.artist_name
        ? {
            id: row.artist_id,
            name: row.artist_name,
            imageUrl: row.artist_image_url,
            genres: row.artist_genres || [],
            spotifyId: row.artist_spotify_id,
          }
        : undefined,
    }))

    const headers = new Headers()
    if (typeof totalCount === "number" && !Number.isNaN(totalCount)) {
      headers.set("x-total-count", String(totalCount))
    }
    return new NextResponse(JSON.stringify(formattedGenerations), { headers })
  } catch (error) {
    console.error("Failed to fetch generations:", error)

    if (error instanceof Error && (error.message.includes("must be") || error.message.includes("between"))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, userId, userQuestions, originalPrompts, refinedPrompts, generationMetadata } = body

    if (!artistId || !originalPrompts || !refinedPrompts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const now = new Date()
    let result
    try {
      result = await sql`
        INSERT INTO generations (
          artist_id, user_id, user_questions, original_prompts, refined_prompts, generation_metadata, created_at
        ) VALUES (
          ${artistId}, ${userId || null}, ${JSON.stringify(userQuestions || [])}, 
          ${JSON.stringify(originalPrompts)}, ${JSON.stringify(refinedPrompts)}, 
          ${JSON.stringify(generationMetadata || {})}, ${now}
        )
        RETURNING *
      `
    } catch (e: any) {
      if (String(e?.message || e).includes("user_id")) {
        result = await sql`
          INSERT INTO generations (
            artist_id, user_questions, original_prompts, refined_prompts, generation_metadata, created_at
          ) VALUES (
            ${artistId}, ${JSON.stringify(userQuestions || [])}, 
            ${JSON.stringify(originalPrompts)}, ${JSON.stringify(refinedPrompts)}, 
            ${JSON.stringify(generationMetadata || {})}, ${now}
          )
          RETURNING *
        `
      } else {
        throw e
      }
    }

    const generation = result[0]
    return NextResponse.json({
      id: Number(generation.id),
      artistId: generation.artist_id,
      userQuestions: generation.user_questions,
      originalPrompts: generation.original_prompts,
      refinedPrompts: generation.refined_prompts,
      generationMetadata: generation.generation_metadata,
      createdAt: new Date(generation.created_at),
    })
  } catch (error) {
    console.error("Failed to save generation:", error)
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 })
  }
}

// New endpoint: GET /api/generations/latest?artistId=&user=
export async function GET_LATEST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get("artistId") || ""
  const userId = searchParams.get("user") || undefined
  if (!artistId) return NextResponse.json({ error: "artistId is required" }, { status: 400 })
  const row = await getLatestGenerationByArtistAndUser(artistId, userId)
  return NextResponse.json(row)
}
