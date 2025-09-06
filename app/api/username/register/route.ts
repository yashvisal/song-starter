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
      // someone else registered first
      const existing = await sql`SELECT id, username FROM users WHERE LOWER(username) = LOWER(${name}) LIMIT 1`
      return NextResponse.json(existing[0] || { error: "taken" }, { status: existing.length ? 200 : 409 })
    }
    return NextResponse.json(rows[0])
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}


