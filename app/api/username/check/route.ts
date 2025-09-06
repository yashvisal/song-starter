import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = (searchParams.get("name") || "").trim()
    if (!name) return NextResponse.json({ exists: false })

    const rows = await sql`
      SELECT 1 FROM users WHERE LOWER(username) = LOWER(${name}) LIMIT 1
    `
    const exists = rows.length > 0
    return NextResponse.json({ exists })
  } catch (e) {
    return NextResponse.json({ exists: false })
  }
}


