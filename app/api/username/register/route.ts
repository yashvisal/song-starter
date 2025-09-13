import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { v4 as uuidv4 } from "uuid"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    const name = (username || "").trim()
    if (!name) return NextResponse.json({ error: "username required" }, { status: 400 })

    const id = uuidv4()
    const rows = await sql`
      INSERT INTO users (id, username)
      VALUES (${id}, ${name})
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username
    `
    if (rows.length === 0) {
      // Username already taken
      return NextResponse.json({ error: "taken" }, { status: 409 })
    }
    const response = NextResponse.json(rows[0])
    // Persist identity via cookie for server-side routes
    response.cookies.set("suno_username", rows[0].username, { path: "/", maxAge: 60 * 60 * 24 * 365 })
    return response
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}


