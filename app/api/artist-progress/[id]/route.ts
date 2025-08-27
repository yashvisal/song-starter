import { NextResponse, type NextRequest } from "next/server"
import { getArtistProgress } from "@/lib/progress"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const prog = getArtistProgress(id)
  return NextResponse.json(prog || { phase: "idle", position: 0, total: 0 })
}


