import { env } from "./env"
import type { AudioFeatures } from "./types"

type FetchOptions = {
  signal?: AbortSignal
}

function clamp01(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  const v = Math.round(value)
  if (v < min) return min
  if (v > max) return max
  return v
}

function letterKeyToIndex(note: string | undefined): number | undefined {
  if (!note) return undefined
  const cleaned = String(note).trim()
  const map: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  }
  return map[cleaned] ?? undefined
}

function fromPercent(value: number | string | undefined, fallback: number): number {
  if (value === undefined || value === null) return fallback
  const num = typeof value === "number" ? value : Number.parseFloat(value)
  if (!Number.isFinite(num)) return fallback
  // If it's in [0,1], assume already normalized. If >1, treat as percent 0..100
  const normalized = num > 1 ? num / 100 : num
  return clamp01(normalized, fallback)
}

function normalizeToAudioFeatures(payload: any): AudioFeatures {
  const tempo = typeof payload?.tempo === "number" ? payload.tempo : Number.parseFloat(payload?.tempo) || 120
  const loudnessVal = typeof payload?.loudness === "number" ? payload.loudness : Number.parseFloat(String(payload?.loudness || "").replace(/\s*dB/i, ""))
  const loudness = Number.isFinite(loudnessVal) ? loudnessVal : -8

  const keyFromLetter = typeof payload?.key === "string" ? letterKeyToIndex(payload.key) : undefined
  const key = keyFromLetter !== undefined ? keyFromLetter : clampInt(payload?.key, 0, 11, 0)

  const modeStr = String(payload?.mode || "").toLowerCase()
  const mode = modeStr === "major" ? 1 : modeStr === "minor" ? 0 : clampInt(typeof payload?.mode === "number" ? payload.mode : undefined, 0, 1, 1)

  const timeSigRaw = typeof payload?.time_signature === "number" ? payload.time_signature : Number(payload?.time_signature)
  const time_signature = [3, 4].includes(Math.round(timeSigRaw)) ? Math.round(timeSigRaw) : 4

  // Some providers use "happiness" instead of valence
  const valenceSource = payload?.valence ?? payload?.happiness

  return {
    acousticness: fromPercent(payload?.acousticness, 0.3),
    danceability: fromPercent(payload?.danceability, 0.6),
    energy: fromPercent(payload?.energy, 0.6),
    instrumentalness: fromPercent(payload?.instrumentalness, 0.1),
    liveness: fromPercent(payload?.liveness, 0.2),
    loudness,
    speechiness: fromPercent(payload?.speechiness, 0.15),
    tempo,
    valence: fromPercent(valenceSource, 0.55),
    key,
    mode,
    time_signature,
  }
}

async function rapidApiFetch(path: string, params: Record<string, string>, options: FetchOptions = {}) {
  if (!env.RAPIDAPI_KEY || !env.RAPIDAPI_HOST) {
    throw new Error("RapidAPI credentials not configured")
  }
  const url = new URL(`https://${env.RAPIDAPI_HOST}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }

  const controller = new AbortController()
  const signal = options.signal || controller.signal
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": env.RAPIDAPI_KEY,
        "x-rapidapi-host": env.RAPIDAPI_HOST,
      },
      signal,
      next: { revalidate: 60 * 60 * 24 * 7 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`RapidAPI error ${res.status}: ${text}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeTrackBySpotifyId(spotifyTrackId: string): Promise<AudioFeatures> {
  // Endpoint per RapidAPI docs/snippet: /pktx/spotify/{trackId}
  const data = await rapidApiFetch(`/pktx/spotify/${encodeURIComponent(spotifyTrackId)}`, {})
  const features = data?.features || data?.analysis || data
  return normalizeToAudioFeatures(features)
}

export async function analyzeTrackByName(title: string, artist: string): Promise<AudioFeatures> {
  // Unknown endpoint for title+artist in this provider; will add once provided.
  // For now, signal unsupported clearly to callers.
  throw new Error("Title+artist analysis endpoint not configured. Use Spotify track ID for now.")
}


