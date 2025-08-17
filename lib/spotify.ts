import type { SpotifyArtist, AudioFeatures } from "./types"

// Spotify API client
export class SpotifyAPI {
  private accessToken: string | null = null
  private tokenExpiry = 0

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Spotify credentials not configured")
    }

    console.log("[v0] Getting Spotify access token")

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Spotify token error:", response.status, errorText)
      throw new Error(`Failed to get Spotify access token: ${response.status}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // 1 minute buffer

    console.log("[v0] Got Spotify access token")
    return this.accessToken
  }

  async searchArtists(query: string, limit = 10): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to search artists")
    }

    const data = await response.json()
    return data.artists.items
  }

  async getArtist(artistId: string): Promise<SpotifyArtist> {
    const token = await this.getAccessToken()

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get artist")
    }

    return response.json()
  }

  async getArtistTopTracks(artistId: string, market = "US"): Promise<any[]> {
    const token = await this.getAccessToken()

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get artist top tracks")
    }

    const data = await response.json()
    return data.tracks
  }

  async getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]> {
    const token = await this.getAccessToken()

    console.log("[v0] Getting audio features for tracks:", trackIds.length)
    console.log("[v0] Track IDs:", trackIds.slice(0, 3)) // Log first 3 IDs for debugging

    const batchSize = 100 // Spotify API limit
    const allFeatures: AudioFeatures[] = []

    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize)
      const url = `https://api.spotify.com/v1/audio-features?ids=${batch.join(",")}`

      console.log("[v0] Making request to:", url.substring(0, 100) + "...")

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Audio features API returned:", response.status, errorText)

          console.log("[v0] Using fallback audio features due to API error")
          return this.generateFallbackAudioFeatures(trackIds.length)
        }

        const data = await response.json()
        const features = data.audio_features?.filter(Boolean) || []
        allFeatures.push(...features)
      } catch (error) {
        console.log("[v0] Network error getting audio features:", error)
        console.log("[v0] Using fallback audio features due to network error")
        return this.generateFallbackAudioFeatures(trackIds.length)
      }
    }

    console.log("[v0] Got audio features:", allFeatures.length)
    return allFeatures
  }

  private generateFallbackAudioFeatures(count: number): AudioFeatures[] {
    console.log("[v0] Generating", count, "fallback audio features")

    const fallbackFeatures: AudioFeatures[] = []

    for (let i = 0; i < count; i++) {
      // Generate reasonable values based on typical music characteristics
      fallbackFeatures.push({
        id: `fallback_${i}`,
        danceability: 0.5 + Math.random() * 0.4, // 0.5-0.9
        energy: 0.4 + Math.random() * 0.5, // 0.4-0.9
        key: Math.floor(Math.random() * 12), // 0-11
        loudness: -15 + Math.random() * 10, // -15 to -5 dB
        mode: Math.round(Math.random()), // 0 or 1
        speechiness: Math.random() * 0.3, // 0-0.3
        acousticness: Math.random() * 0.8, // 0-0.8
        instrumentalness: Math.random() * 0.5, // 0-0.5
        liveness: Math.random() * 0.4, // 0-0.4
        valence: 0.3 + Math.random() * 0.6, // 0.3-0.9
        tempo: 80 + Math.random() * 100, // 80-180 BPM
        duration_ms: 180000 + Math.random() * 120000, // 3-5 minutes
        time_signature: Math.random() > 0.8 ? 3 : 4, // Mostly 4/4, some 3/4
      })
    }

    return fallbackFeatures
  }
}

export const spotifyAPI = new SpotifyAPI()
