import { NextResponse, type NextRequest } from "next/server"
import { getArtist } from "@/lib/database"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const artist = await getArtist(id)
    if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(artist)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}