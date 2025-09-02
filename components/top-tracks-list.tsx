"use client"

import { useEffect, useState } from "react"

interface TopTrack {
  id: string
  name: string
  popularity?: number
}

interface TopTracksListProps {
  artistId: string
  limit?: number
  tracksPrefetched?: Array<{ id: string; name: string }>
}

export function TopTracksList({ artistId, limit = 8, tracksPrefetched }: TopTracksListProps) {
  const [tracks, setTracks] = useState<TopTrack[] | null>(tracksPrefetched || null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (tracksPrefetched && tracksPrefetched.length) return
      try {
        const res = await fetch(`/api/artist-top-tracks/${artistId}?limit=${limit}`)
        const data = await res.json()
        if (!cancelled) setTracks(Array.isArray(data?.tracks) ? data.tracks : [])
      } catch (e) {
        if (!cancelled) setError("Failed to load tracks")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [artistId, limit, tracksPrefetched])

  if (error) {
    return <div className="text-sm text-muted-foreground">{error}</div>
  }

  if (!tracks) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted/60 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (tracks.length === 0) {
    return <div className="text-sm text-muted-foreground">No top tracks found.</div>
  }

  return (
    <ol className="space-y-3 list-decimal list-inside text-left marker:text-muted-foreground marker:tabular-nums">
      {tracks.map((t) => (
        <li key={t.id} className="text-sm leading-snug break-words">{t.name}</li>
      ))}
    </ol>
  )
}


