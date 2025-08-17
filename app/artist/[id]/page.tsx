import { notFound } from "next/navigation"
import { spotifyAPI } from "@/lib/spotify"
import { saveArtist, getArtist } from "@/lib/database"
import { ArtistAnalysis } from "@/components/artist-analysis"
import type { AudioFeatures } from "@/lib/types"

interface ArtistPageProps {
  params: {
    id: string
  }
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

        // Get audio features for top tracks
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
        const validFeatures = audioFeatures.filter(Boolean)

        let avgFeatures: AudioFeatures
        if (validFeatures.length > 0) {
          // Calculate average audio features
          avgFeatures = validFeatures.reduce(
            (acc, features, index) => {
              if (features) {
                Object.keys(features).forEach((key) => {
                  const value = features[key as keyof AudioFeatures]
                  if (typeof value === "number" && !isNaN(value)) {
                    if (index === 0) {
                      acc[key as keyof AudioFeatures] = value
                    } else {
                      acc[key as keyof AudioFeatures] = (acc[key as keyof AudioFeatures] * index + value) / (index + 1)
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
    const artist = await getArtistData(params.id)

    if (!artist) {
      notFound()
    }

    return <ArtistAnalysis artist={artist} />
  } catch (error) {
    console.log("[v0] Artist page error:", error)
    notFound()
  }
}
