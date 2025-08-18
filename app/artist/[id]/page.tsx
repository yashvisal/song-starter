import { notFound } from "next/navigation"
import { spotifyAPI } from "@/lib/spotify"
import { saveArtist, getArtist } from "@/lib/database"
import { ArtistAnalysis } from "@/components/artist-analysis"
import type { AudioFeatures } from "@/lib/types"
import { fetchTempoKeyForSong } from "@/lib/getsongbpm"

interface ArtistPageProps {
  params: Promise<{
    id: string
  }>
}

async function getArtistData(spotifyId: string) {
  try {
    console.log("[v0] Getting artist data for:", spotifyId)

    // Check if we have cached data
    let artist = await getArtist(spotifyId)

    if (!artist || Date.now() - artist.updatedAt.getTime() > 24 * 60 * 60 * 1000) {
      console.log("[v0] Fetching fresh data from Spotify")

      try {
        // Fetch fresh data from Spotify
        const [spotifyArtist, topTracks] = await Promise.all([
          spotifyAPI.getArtist(spotifyId),
          spotifyAPI.getArtistTopTracks(spotifyId),
        ])

        console.log("[v0] Got artist and top tracks:", spotifyArtist.name, topTracks.length)

        // Get audio features for top tracks (Spotify). If that fails, try GetSongBPM using the first top track title
        const trackIds = topTracks
          .slice(0, 10)
          .map((track) => track.id)
          .filter(Boolean)
        console.log("[v0] Getting audio features for track IDs:", trackIds.length)

        if (trackIds.length === 0) {
          throw new Error("No valid track IDs found")
        }

        let audioFeatures: any[] = []
        try {
          audioFeatures = await spotifyAPI.getAudioFeatures(trackIds)
          console.log("[v0] Got audio features:", audioFeatures.length)
        } catch (audioError) {
          console.log("[v0] Audio features failed, using empty array:", audioError)
          // If audio features completely fail, we'll use default values
          audioFeatures = []
        }

        // Audio features will always be returned (either real or fallback)
        let validFeatures = audioFeatures.filter(Boolean)

        if (validFeatures.length === 0 && topTracks.length > 0) {
          const representative = topTracks[0]
          const tempoKey = await fetchTempoKeyForSong(representative.name, spotifyArtist.name)
          if (tempoKey) {
            validFeatures = [
              {
                acousticness: 0.3,
                danceability: 0.6,
                energy: 0.6,
                instrumentalness: 0.1,
                liveness: 0.2,
                loudness: -8,
                speechiness: 0.15,
                tempo: tempoKey.tempo ?? 120,
                valence: 0.55,
                key: tempoKey.key ?? 0,
                mode: tempoKey.mode ?? 1,
                time_signature: tempoKey.time_signature ?? 4,
              } as AudioFeatures,
            ]
            console.log("[v0] Populated features from GetSongBPM fallback")
          }
        }

        let avgFeatures: AudioFeatures
        if (validFeatures.length > 0) {
          // Calculate average audio features
          avgFeatures = validFeatures.reduce(
            (acc, features, index) => {
              if (features) {
                ;(
                  [
                    "acousticness",
                    "danceability",
                    "energy",
                    "instrumentalness",
                    "liveness",
                    "loudness",
                    "speechiness",
                    "tempo",
                    "valence",
                    "key",
                    "mode",
                    "time_signature",
                  ] as Array<keyof AudioFeatures>
                ).forEach((key) => {
                  const value = features[key]
                  if (typeof value === "number" && !isNaN(value)) {
                    if (index === 0) {
                      acc[key] = value
                    } else {
                      acc[key] = (acc[key] * index + value) / (index + 1)
                    }
                  }
                })
              }
              return acc
            },
            {
              acousticness: 0,
              danceability: 0,
              energy: 0,
              instrumentalness: 0,
              liveness: 0,
              loudness: 0,
              speechiness: 0,
              tempo: 120, // Default tempo
              valence: 0.5, // Default valence
              key: 0,
              mode: 1,
              time_signature: 4,
            } as AudioFeatures,
          )
        } else {
          // Use completely default values if no features available
          avgFeatures = {
            acousticness: 0.5,
            danceability: 0.7,
            energy: 0.6,
            instrumentalness: 0.1,
            liveness: 0.2,
            loudness: -8,
            speechiness: 0.1,
            tempo: 120,
            valence: 0.6,
            key: 5,
            mode: 1,
            time_signature: 4,
          } as AudioFeatures
        }

        // Sanitize averaged fields to valid ranges/integers
        avgFeatures.key = Math.max(0, Math.min(11, Math.round(avgFeatures.key)))
        avgFeatures.mode = avgFeatures.mode >= 0.5 ? 1 : 0
        avgFeatures.time_signature = [3, 4].includes(Math.round(avgFeatures.time_signature))
          ? Math.round(avgFeatures.time_signature)
          : 4

        console.log("[v0] Calculated average features:", avgFeatures)

        // Save to database
        artist = await saveArtist({
          spotifyId: spotifyArtist.id,
          name: spotifyArtist.name,
          genres: spotifyArtist.genres || [],
          popularity: spotifyArtist.popularity || 0,
          followers: spotifyArtist.followers?.total || 0,
          imageUrl: spotifyArtist.images?.[0]?.url || "",
          audioFeatures: avgFeatures,
        })

        console.log("[v0] Saved artist to database")
      } catch (spotifyError) {
        console.log("[v0] Spotify API error:", spotifyError)
        artist = await getArtist(spotifyId)
        if (!artist) {
          throw new Error(
            `Unable to fetch artist data: ${spotifyError instanceof Error ? spotifyError.message : "Unknown error"}`,
          )
        }
        console.log("[v0] Using existing cached data due to API error")
      }
    } else {
      console.log("[v0] Using cached artist data")
    }

    return artist
  } catch (error) {
    console.log("[v0] Failed to get artist data:", error)
    if (error instanceof Error) {
      console.log("[v0] Error details:", error.message, error.stack)
    }
    throw error // Re-throw the original error instead of wrapping it
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  try {
    const { id } = await params
    const artist = await getArtistData(id)

    if (!artist) {
      notFound()
    }

    return <ArtistAnalysis artist={artist} />
  } catch (error) {
    console.log("[v0] Artist page error:", error)
    notFound()
  }
}
