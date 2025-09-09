import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { v4 as uuidv4 } from "uuid"

const sql = neon(process.env.DATABASE_URL!)

function cleanName(input: string): string {
  return (input || "").replace(/[^a-z0-9]/gi, "").slice(0, 20)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const newRaw = typeof body?.newUsername === "string" ? body.newUsername : ""
    const newName = cleanName(newRaw)
    if (!newName || newName.length < 3) {
      return NextResponse.json({ error: "invalid_username" }, { status: 400 })
    }

    const cookieHeader = request.headers.get("cookie") || ""
    const cookieUser = /suno_username=([^;]+)/.exec(cookieHeader)?.[1] || ""

    // If desired name equals current cookie, just set cookie and return
    if (cookieUser && cookieUser.toLowerCase() === newName.toLowerCase()) {
      const resp = NextResponse.json({ username: cookieUser, updated: 0 })
      resp.cookies.set("suno_username", cookieUser, { path: "/", maxAge: 60 * 60 * 24 * 365 })
      return resp
    }

    // Enforce uniqueness (case-insensitive)
    const taken = await sql`SELECT 1 FROM users WHERE LOWER(username) = LOWER(${newName}) LIMIT 1`
    if (taken.length > 0) {
      return NextResponse.json({ error: "taken" }, { status: 409 })
    }

    // Ensure target username exists in users table
    const newId = uuidv4()
    await sql`
      INSERT INTO users (id, username)
      VALUES (${newId}, ${newName})
      ON CONFLICT (username) DO NOTHING
    `

    let updated = 0
    if (cookieUser) {
      // Migrate past generations from old username to new username
      const res = await sql`
        UPDATE generations
        SET user_id = ${newName}
        WHERE user_id = ${cookieUser}
        RETURNING id
      `
      updated = res.length || 0
    }

    const response = NextResponse.json({ username: newName, updated })
    response.cookies.set("suno_username", newName, { path: "/", maxAge: 60 * 60 * 24 * 365 })
    return response
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}


