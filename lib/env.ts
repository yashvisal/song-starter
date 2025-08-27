export const env = {
  // Spotify API credentials (to be added by user)
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // OpenAI for LLM
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",

  // GetSongBPM API (optional fallback for tempo/key)
  GETSONGBPM_API_KEY: process.env.GETSONGBPM_API_KEY || "",

  // RapidAPI Track Analysis
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "track-analysis.p.rapidapi.com",

  // App URL for redirects
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const

export function validateEnv() {
  const required = ["DATABASE_URL", "OPENAI_API_KEY", "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"] as const
  const missing = required.filter((key) => !env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Please configure these in your Vercel project settings.`,
    )
  }

  // Validate URL format for DATABASE_URL
  if (
    env.DATABASE_URL &&
    !env.DATABASE_URL.startsWith("postgres://") &&
    !env.DATABASE_URL.startsWith("postgresql://")
  ) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string")
  }
}

// Granular validators for endpoints that only need a subset of env vars
export function assertDatabaseEnv() {
  if (!env.DATABASE_URL) {
    throw new Error("Missing required environment variable: DATABASE_URL")
  }
  if (
    env.DATABASE_URL &&
    !env.DATABASE_URL.startsWith("postgres://") &&
    !env.DATABASE_URL.startsWith("postgresql://")
  ) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string")
  }
}

export function assertSpotifyEnv() {
  const missing: string[] = []
  if (!env.SPOTIFY_CLIENT_ID) missing.push("SPOTIFY_CLIENT_ID")
  if (!env.SPOTIFY_CLIENT_SECRET) missing.push("SPOTIFY_CLIENT_SECRET")
  if (missing.length) {
    throw new Error(`Missing required Spotify environment variables: ${missing.join(", ")}`)
  }
}

export function assertOpenAIEnv() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY")
  }
}

export function assertGetSongBpmEnv() {
  if (!env.GETSONGBPM_API_KEY) {
    throw new Error("Missing required environment variable: GETSONGBPM_API_KEY")
  }
}

export function assertRapidApiEnv() {
  const missing: string[] = []
  if (!env.RAPIDAPI_KEY) missing.push("RAPIDAPI_KEY")
  if (!env.RAPIDAPI_HOST) missing.push("RAPIDAPI_HOST")
  if (missing.length) {
    throw new Error(`Missing required RapidAPI environment variables: ${missing.join(", ")}`)
  }
}