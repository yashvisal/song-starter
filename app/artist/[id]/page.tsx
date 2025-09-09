import { notFound } from "next/navigation"
import { spotifyAPI } from "@/lib/spotify"
import { saveArtist, getArtist, getLatestGenerationByArtistAndUser, saveGeneration } from "@/lib/database"
import { ArtistAnalysis } from "@/components/artist-analysis"
import { analyzeArtistAndGeneratePrompts } from "@/lib/llm"
import type { AudioFeatures } from "@/lib/types"
import { fetchAudioFeaturesReccoBeats } from "@/lib/reccobeats"
import { cookies } from "next/headers"

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

        // Get audio features for top tracks via ReccoBeats (much faster!)
        const tracksToAnalyze = topTracks.slice(0, 8)
        const trackIds = tracksToAnalyze.map(track => track.id)
        const trackInfo = tracksToAnalyze.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist'
        }))
        
        console.log(`[v0] Starting audio feature analysis for ${tracksToAnalyze.length} top tracks:`)
        tracksToAnalyze.forEach((track, index) => {
          console.log(`  ${index + 1}. ${track.name} - ${track.artists?.[0]?.name || 'Unknown'} (${track.id})`)
        })
        
        const validFeatures = await fetchAudioFeaturesReccoBeats(trackIds, trackInfo)
        console.log(`[v0] Audio feature analysis complete: ${validFeatures.length}/${trackIds.length} tracks successful`)

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
                  const value = (features as any)[key]
                  if (typeof value === "number" && !isNaN(value)) {
                    if (index === 0) {
                      ;(acc as any)[key] = value
                    } else {
                      const prev = (acc as any)[key] as number
                      ;(acc as any)[key] = (prev * index + value) / (index + 1)
                    }
                  }
                })
                // Note: ReccoBeats doesn't provide popularity or duration_ms
                // These fields will remain undefined
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

        console.log("[v0] Calculated average features from", validFeatures.length, "tracks:")
        console.log("  Final averages:", {
          energy: `${(avgFeatures.energy * 100).toFixed(1)}%`,
          danceability: `${(avgFeatures.danceability * 100).toFixed(1)}%`,
          valence: `${(avgFeatures.valence * 100).toFixed(1)}%`,
          tempo: `${avgFeatures.tempo.toFixed(1)} BPM`,
          key: avgFeatures.key,
          mode: avgFeatures.mode === 1 ? 'Major' : 'Minor',
          acousticness: `${(avgFeatures.acousticness * 100).toFixed(1)}%`,
          loudness: `${avgFeatures.loudness.toFixed(1)} dB`
        })

        // Precompute LLM analysis so the page renders with prompts ready
        const initialAnalysis = await analyzeArtistAndGeneratePrompts({
          ...spotifyArtist,
          spotifyId: spotifyArtist.id,
          imageUrl: spotifyArtist.images?.[0]?.url || "",
          followers: spotifyArtist.followers?.total || 0,
          audioFeatures: avgFeatures,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)

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
        ;(artist as any).__initialAnalysis = initialAnalysis

        // Persist initial analysis to generations to enable seamless hydration
        try {
          const cookieStore = await cookies()
          const userId = cookieStore.get("suno_username")?.value
          // Prefer user-scoped existing generation if logged-in user available
          const existingUserScoped = userId ? await getLatestGenerationByArtistAndUser(artist.id, userId) : null
          // Fallback to artist-only existing generation
          const existingArtistScoped = !existingUserScoped ? await getLatestGenerationByArtistAndUser(artist.id, null) : null

          if (!existingUserScoped && !existingArtistScoped) {
            const gen = await saveGeneration({
              artistId: artist.id,
              userId: userId || undefined,
              userQuestions: [],
              originalPrompts: initialAnalysis.initialPrompts,
              refinedPrompts: [],
              generationMetadata: {
                analysisData: initialAnalysis,
                timestamp: new Date().toISOString(),
                processingTime: 0,
                phase: "initial",
              },
            })
            ;(artist as any).__initialGeneration = gen
          } else {
            const picked = existingUserScoped || existingArtistScoped
            // Only hydrate refined prompts if generation belongs to current user
            const owned = userId && picked?.userId && picked.userId === userId
            ;(artist as any).__initialGeneration = owned ? picked : { ...picked, refinedPrompts: [] }
          }
        } catch {}
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

      // Hydrate initial analysis/generation from DB if available (prevents client flicker)
      try {
        const cookieStore = await cookies()
        const userId = cookieStore.get("suno_username")?.value
        const latestUser = userId ? await getLatestGenerationByArtistAndUser(artist.id, userId) : null
        const latestArtist = !latestUser ? await getLatestGenerationByArtistAndUser(artist.id, null) : null
        const latest = latestUser || latestArtist
        if (latest?.generationMetadata?.analysisData) {
          ;(artist as any).__initialAnalysis = latest.generationMetadata.analysisData
        }
        if (latest) {
          const owned = userId && latest.userId && latest.userId === userId
          ;(artist as any).__initialGeneration = owned ? latest : { ...latest, refinedPrompts: [] }
        }
      } catch {}
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

    // Pass precomputed analysis and initial generation into the analysis component
    const initialAnalysis = (artist as any).__initialAnalysis || null
    const initialGeneration = (artist as any).__initialGeneration || null

          return (
        <>
          <ArtistAnalysis artist={artist} initialAnalysis={initialAnalysis} initialGeneration={initialGeneration} />
        </>
      )
  } catch (error) {
    console.log("[v0] Artist page error:", error)
    notFound()
  }
}
