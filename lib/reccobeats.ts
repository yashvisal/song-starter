import type { AudioFeatures } from "./types"

interface ReccoBeatsAudioFeatures {
  id: string
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  key: number
  liveness: number
  loudness: number
  mode: number
  speechiness: number
  tempo: number
  time_signature: number
  valence: number
}

interface ReccoBeatsResponse {
  content: ReccoBeatsAudioFeatures[]
}

/**
 * Fetch audio features for multiple Spotify track IDs using ReccoBeats API
 * Much faster than the old RapidAPI approach - supports up to 40 tracks per request
 */
export async function fetchAudioFeaturesReccoBeats(
  trackIds: string[], 
  trackInfo?: Array<{id: string, name: string, artist: string}>
): Promise<AudioFeatures[]> {
  if (trackIds.length === 0) {
    console.log("[ReccoBeats] No track IDs provided")
    return []
  }
  
  // ReccoBeats supports up to 40 IDs per request
  if (trackIds.length > 40) {
    console.warn(`[ReccoBeats] Truncating from ${trackIds.length} to 40 track IDs`)
    trackIds = trackIds.slice(0, 40)
  }

  // Log the tracks we're trying to analyze
  console.log(`[ReccoBeats] Requesting features for ${trackIds.length} tracks:`)
  trackIds.forEach((id, index) => {
    const info = trackInfo?.find(t => t.id === id)
    if (info) {
      console.log(`  ${index + 1}. ${info.name} - ${info.artist} (ID: ${id})`)
    } else {
      console.log(`  ${index + 1}. Track ID: ${id}`)
    }
  })

  try {
    // Build query string with multiple ids
    const params = new URLSearchParams()
    trackIds.forEach(id => params.append('ids', id))
    
    const url = `https://api.reccobeats.com/v1/audio-features?${params.toString()}`
    console.log(`[ReccoBeats] API URL: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ReccoBeats] API Error: ${response.status} - ${errorText}`)
      console.error(`[ReccoBeats] Failed URL: ${url}`)
      return []
    }

    const data: ReccoBeatsResponse = await response.json()
    const receivedCount = data.content?.length || 0
    
    console.log(`[ReccoBeats] API Response: ${receivedCount}/${trackIds.length} features received`)
    
    // Log which tracks we got features for and which we didn't
    const receivedIds = new Set((data.content || []).map(f => f.id))
    
    console.log("[ReccoBeats] Successfully retrieved features for:")
    data.content?.forEach((feature, index) => {
      const info = trackInfo?.find(t => t.id === feature.id)
      if (info) {
        console.log(`  ✓ ${info.name} - ${info.artist} (ID: ${feature.id})`)
        console.log(`    Energy: ${(feature.energy * 100).toFixed(1)}%, Tempo: ${feature.tempo.toFixed(1)} BPM, Key: ${feature.key}, Mode: ${feature.mode ? 'Major' : 'Minor'}`)
      } else {
        console.log(`  ✓ Track ID: ${feature.id}`)
        console.log(`    Energy: ${(feature.energy * 100).toFixed(1)}%, Tempo: ${feature.tempo.toFixed(1)} BPM, Key: ${feature.key}, Mode: ${feature.mode ? 'Major' : 'Minor'}`)
      }
    })

    const missingIds = trackIds.filter(id => !receivedIds.has(id))
    if (missingIds.length > 0) {
      console.warn(`[ReccoBeats] Missing features for ${missingIds.length} tracks:`)
      missingIds.forEach(id => {
        const info = trackInfo?.find(t => t.id === id)
        if (info) {
          console.warn(`  ✗ ${info.name} - ${info.artist} (ID: ${id})`)
        } else {
          console.warn(`  ✗ Track ID: ${id}`)
        }
      })
    }

    // Convert ReccoBeats format to our AudioFeatures format
    const audioFeatures = (data.content || []).map((feature): AudioFeatures => ({
      acousticness: feature.acousticness,
      danceability: feature.danceability,
      energy: feature.energy,
      instrumentalness: feature.instrumentalness,
      liveness: feature.liveness,
      loudness: feature.loudness,
      speechiness: feature.speechiness,
      tempo: feature.tempo,
      valence: feature.valence,
      key: feature.key,
      mode: feature.mode,
      time_signature: feature.time_signature || 4,
      // Note: ReccoBeats doesn't provide popularity or duration_ms
      // These would need to come from Spotify if needed
    }))

    console.log(`[ReccoBeats] Conversion complete: ${audioFeatures.length} AudioFeatures objects created`)
    return audioFeatures

  } catch (error) {
    console.error("[ReccoBeats] Fetch error:", error)
    console.error("[ReccoBeats] Error details:", {
      trackCount: trackIds.length,
      firstFewIds: trackIds.slice(0, 3),
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    return []
  }
}
