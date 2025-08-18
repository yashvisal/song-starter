import { env } from "./env"

export interface TempoKeyInfo {
  tempo?: number
  key?: number
  mode?: 0 | 1
  time_signature?: number
}

function noteToKeyIndex(note: string): number | undefined {
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
  return map[note]
}

function parseKeyString(keyString: string): { key?: number; mode?: 0 | 1 } {
  const cleaned = keyString.trim()
  // Examples: "C Major", "A minor", "F#m", "Bb maj"
  const minor = /minor|\bm\b|min/i.test(cleaned)
  const major = /major|\bmaj\b/i.test(cleaned)
  const noteMatch = cleaned.match(/([A-G](#|b)?)/)
  const keyIndex = noteMatch ? noteToKeyIndex(noteMatch[1]) : undefined
  const mode: 0 | 1 | undefined = minor ? 0 : major ? 1 : undefined
  return { key: keyIndex, mode }
}

export async function fetchTempoKeyForSong(
  title: string,
  artist: string,
): Promise<TempoKeyInfo | null> {
  if (!env.GETSONGBPM_API_KEY) return null

  try {
    // Heuristic search query combines title and artist for better matching
    const query = encodeURIComponent(`${title} ${artist}`)
    const url = `https://api.getsongbpm.com/search/?api_key=${env.GETSONGBPM_API_KEY}&type=song&lookup=${query}`

    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json().catch(() => null)
    if (!data) return null

    const items = (data.search || data.results || data.songs || []) as any[]
    if (!Array.isArray(items) || items.length === 0) return null

    const first = items[0] || {}

    // Try to extract tempo/BPM
    const tempo: number | undefined =
      typeof first.tempo === "number"
        ? first.tempo
        : typeof first.bpm === "number"
          ? first.bpm
          : typeof first.Tempo === "number"
            ? first.Tempo
            : undefined

    // Try to extract key string
    const keyString: string | undefined =
      typeof first.key === "string"
        ? first.key
        : typeof first.key_name === "string"
          ? first.key_name
          : typeof first.music_key === "string"
            ? first.music_key
            : undefined

    let parsed: { key?: number; mode?: 0 | 1 } = {}
    if (keyString) parsed = parseKeyString(keyString)

    return {
      tempo,
      key: parsed.key,
      mode: parsed.mode,
      time_signature: 4, // API likely doesn't return this; assume common time
    }
  } catch (e) {
    console.log("[v0] GetSongBPM fetch failed:", e)
    return null
  }
}

