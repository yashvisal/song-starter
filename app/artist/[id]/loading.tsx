"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

export default function Loading() {
  const pathname = usePathname()
  const artistId = useMemo(() => pathname?.split("/").pop() || "", [pathname])
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<"fetching" | "analyzing" | "averaging" | "done">("fetching")

  useEffect(() => {
    let timer: any
    async function fetchTracks() {
      try {
        const res = await fetch(`/api/artist-top-tracks/${artistId}?limit=8`)
        const data = await res.json()
        if (Array.isArray(data?.tracks)) setTracks(data.tracks)
      } catch {}
    }
    fetchTracks().then(() => setPhase("analyzing"))
    // Advance message every ~2.2s and stop after the last message
    timer = setInterval(() => setIdx((i) => i + 1), 10000)
    return () => clearInterval(timer)
  }, [artistId])

  // Poll server-side progress for current track and phase
  useEffect(() => {
    let cancel = false
    let poll: any
    async function tick() {
      try {
        const res = await fetch(`/api/artist-progress/${artistId}`)
        const data = await res.json()
        if (cancel) return
        if (data?.phase) setPhase(data.phase)
        if (Array.isArray(tracks) && data?.currentTrackName) {
          const foundIdx = tracks.findIndex((t) => t.name === data.currentTrackName)
          if (foundIdx >= 0) setIdx(foundIdx)
        }
      } catch {}
    }
    poll = setInterval(tick, 1000)
    tick()
    return () => {
      cancel = true
      clearInterval(poll)
    }
  }, [artistId, tracks])

  const canned = [
    "Getting top tracks…",
    "Analyzing audio features…",
    "Estimating tempo and key…",
    "Measuring energy and danceability…",
    "Assessing mood and vibe…",
    "Summarizing results…",
    "Gathering Data for Prompts…",
  ]
  const current = canned[Math.min(idx, canned.length - 1)]

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">Please wait…</div>
        <div className="text-lg font-medium">{current}</div>
      </div>
    </div>
  )
}


