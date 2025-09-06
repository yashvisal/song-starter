// Minimal migration runner for user support
// Usage (Windows cmd):
//   set DATABASE_URL=YOUR_NEON_URL && node scripts\migrate-users.mjs
// PowerShell:
//   $env:DATABASE_URL="YOUR_NEON_URL"; node scripts/migrate-users.mjs
// macOS/Linux:
//   DATABASE_URL=YOUR_NEON_URL node scripts/migrate-users.mjs

import { neon } from "@neondatabase/serverless"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

function readEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  // Best-effort: try to read from .env.local if present
  const dotEnvPath = resolve(process.cwd(), ".env.local")
  if (existsSync(dotEnvPath)) {
    try {
      const content = readFileSync(dotEnvPath, "utf8")
      const match = content.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
      if (match && match[1]) return match[1].trim()
    } catch {}
  }
  return null
}

let dbUrl = readEnvDatabaseUrl()
if (!dbUrl) {
  console.error("DATABASE_URL is not set. Set it in your environment or .env.local and re-run.")
  process.exit(1)
}

// Sanitize: remove surrounding quotes and whitespace that may be copied from Neon UI
dbUrl = dbUrl.trim().replace(/^['"]|['"]$/g, "")

// Normalize Neon URL for @neondatabase/serverless
// - Accept both postgres:// and postgresql:// (convert latter)
// - Remove unsupported query param channel_binding
try {
  // Convert scheme if needed
  if (dbUrl.startsWith("postgresql://")) {
    dbUrl = dbUrl.replace(/^postgresql:\/\//, "postgres://")
  }
  // Strip channel_binding param if present
  const urlObj = new URL(dbUrl)
  if (urlObj.searchParams.has("channel_binding")) {
    urlObj.searchParams.delete("channel_binding")
    dbUrl = urlObj.toString()
  }
} catch (e) {
  // Fallback: basic string replacement if URL parsing failed
  dbUrl = dbUrl
    .replace(/^postgresql:\/\//, "postgres://")
    .replace(/[?&]channel_binding=require\b/, "")
}

const sql = neon(dbUrl)

async function runQueryFile(file) {
  const abs = resolve(process.cwd(), file)
  const q = readFileSync(abs, "utf8")
  // Remove line comments and split into individual statements
  const cleaned = q.replace(/--.*$/gm, "").trim()
  const statements = cleaned
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  console.log(`\nRunning ${file} (${statements.length} statements)`) 
  for (const stmt of statements) {
    await sql.query(stmt)
  }
  console.log(`Done ${file}`)
}

async function main() {
  try {
    await runQueryFile("scripts/003-add-user-support.sql")
    await runQueryFile("scripts/004-users.sql")
    console.log("\nAll migrations complete.")
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  }
}

await main()


