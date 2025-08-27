import type { AudioFeatures } from "./types"
import { spotifyAPI } from "./spotify"
import { analyzeTrackBySpotifyId } from "./trackAnalysis"
import { setArtistProgress } from "./progress"

export async function fetchAudioFeaturesForTopTracks(artistId: string, limit = 8): Promise<AudioFeatures[]> {
  const topTracks = await spotifyAPI.getArtistTopTracks(artistId)
  const selected = topTracks.slice(0, Math.max(1, Math.min(limit, 10)))

  console.log("[v0] Aggregator: selected top tracks:",
    selected.map((t: any) => ({ id: t?.id, name: t?.name, popularity: t?.popularity })).slice(0, 10),
  )

  setArtistProgress(artistId, { phase: "analyzing", position: 0, total: selected.length, currentTrackName: undefined })

  const results: Array<AudioFeatures | null> = []
  for (let index = 0; index < selected.length; index++) {
    const t = selected[index]
    const id = t?.id
    if (!id) {
      results.push(null)
      continue
    }
    try {
      console.log("[v0] RapidAPI: analyzing track", { id, name: t?.name, position: index + 1, total: selected.length })
      setArtistProgress(artistId, { position: index + 1, currentTrackName: t?.name })
      // Strictly sequential: wait for the network response before proceeding
      const features = await analyzeTrackBySpotifyId(id)
      console.log("[v0] RapidAPI: features", {
        id,
        name: t?.name,
        tempo: features.tempo,
        energy: Number(features.energy.toFixed(3)),
        danceability: Number(features.danceability.toFixed(3)),
        valence: Number(features.valence.toFixed(3)),
        key: features.key,
        mode: features.mode,
      })
      results.push(features)
    } catch (e) {
      console.log("[v0] RapidAPI: failed to analyze track", { id, name: t?.name, error: String(e) })
      results.push(null)
    }
    // No artificial delay; we proceed immediately after the response to avoid overlapping and keep UX snappy
  }
  setArtistProgress(artistId, { phase: "averaging", currentTrackName: undefined })

  const valid = results.filter((x): x is AudioFeatures => Boolean(x))
  console.log("[v0] Aggregator: collected feature count:", valid.length)
  setArtistProgress(artistId, { phase: "done", currentTrackName: undefined })
  return valid
}


