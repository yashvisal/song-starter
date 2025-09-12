"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Generation, Artist } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { TopTracksList } from "./top-tracks-list"
import { Progress } from "@/components/ui/progress"
import { X, Copy, Check } from "lucide-react"

interface GalleryModalProps {
  open: boolean
  onClose: () => void
  generation: Generation | null
}

export function GalleryModal({ open, onClose, generation }: GalleryModalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [artistFull, setArtistFull] = useState<Artist | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [tracksPrefetched, setTracksPrefetched] = useState<Array<{ id: string; name: string }> | null>(null)
  const [isLoadingHeader, setIsLoadingHeader] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  const artistSpotifyId = generation?.artist?.spotifyId || ""

  // Derive a minimal Artist shape from Generation for headers
  const headerArtist: Artist | null = useMemo(() => {
    if (!generation?.artist) return null
    return {
      id: generation.artist.id,
      name: generation.artist.name,
      genres: generation.artist.genres || [],
      popularity: 0,
      followers: 0,
      imageUrl: generation.artist.imageUrl,
      spotifyId: generation.artist.spotifyId || generation.artist.id,
      audioFeatures: {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        loudness: -8,
        speechiness: 0,
        tempo: 120,
        valence: 0.5,
        key: 0,
        mode: 1,
        time_signature: 4,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }, [generation])

  useEffect(() => {
    if (!open || !generation) return
    // Try to hydrate analysis from generation metadata if present
    const meta = (generation as any)?.generationMetadata
    if (meta?.analysisData) {
      setAnalysis(meta.analysisData)
      return
    }
    setAnalysis(null)
  }, [open, generation])

  // Track whether the scroll container actually overflows
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const checkOverflow = () => {
      const needsScroll = el.scrollHeight > el.clientHeight + 1
      setIsScrollable(needsScroll)
    }

    checkOverflow()
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(el)
    window.addEventListener("resize", checkOverflow)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", checkOverflow)
    }
  }, [open, activeTab, analysis, artistFull, tracksPrefetched])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const id = generation?.artist?.spotifyId || generation?.artist?.id
        if (!id) return
        setIsLoadingHeader(true)
        const [artistRes, tracksRes] = await Promise.all([
          fetch(`/api/artists/${id}`),
          fetch(`/api/artist-top-tracks/${id}?limit=8`),
        ])
        if (artistRes.ok) {
          const art = await artistRes.json()
          if (!cancelled) setArtistFull(art)
        }
        if (tracksRes.ok) {
          const payload = await tracksRes.json()
          const arr = Array.isArray(payload?.tracks) ? payload.tracks : []
          if (!cancelled) setTracksPrefetched(arr.map((t: any) => ({ id: t.id, name: t.name })))
        }
      } catch {}
      finally {
        if (!cancelled) setIsLoadingHeader(false)
      }
    }
    if (open && generation) run()
    return () => {
      cancelled = true
    }
  }, [open, generation])

  // Ensure every newly opened artist modal starts at the first tab
  useEffect(() => {
    if (open && generation) {
      setActiveTab("overview")
    }
  }, [open, generation?.id])

  if (!open || !generation) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full sm:max-w-3xl max-h-[85vh] rounded-t-2xl sm:rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-3">
          <div className="min-w-0 flex items-center gap-2">
            {generation.artist?.imageUrl && (
              <img
                src={generation.artist.imageUrl || "/placeholder.svg"}
                alt={generation.artist?.name || "Artist"}
                className="h-8 w-8 rounded-md object-cover"
              />
            )}
            <div className="truncate">
              <h3 className="truncate text-base font-medium text-neutral-900">{generation.artist?.name || "Prompt Pack"}</h3>
              <p className="mt-0.5 text-[11px] text-neutral-600">
                {generation.userId ? `by ${generation.userId}` : "Community"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-neutral-50 text-neutral-700" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="px-4 pb-6 pt-0 overflow-y-auto max-h-[calc(85vh-48px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-0 z-10 -mx-4 mb-3 px-4 py-2 bg-white">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-3">
              <div className="space-y-3">
                {artistFull ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <div className="text-[11px] text-neutral-500">Followers</div>
                        <div className="text-sm font-medium text-neutral-900">{artistFull.followers.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-neutral-500">Popularity</div>
                        <div className="text-sm font-medium text-neutral-900">{artistFull.popularity}/100</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-neutral-500">Tempo</div>
                        <div className="text-sm font-medium text-neutral-900">{Math.round(artistFull.audioFeatures.tempo)} BPM</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-neutral-500">Key</div>
                        <div className="text-sm font-medium text-neutral-900">{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][artistFull.audioFeatures.key]}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
                          <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {artistFull ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="space-y-3">
                      {[{ name: "Energy", value: artistFull.audioFeatures.energy * 100 },
                        { name: "Danceability", value: artistFull.audioFeatures.danceability * 100 },
                        { name: "Valence", value: artistFull.audioFeatures.valence * 100 },
                        { name: "Acousticness", value: artistFull.audioFeatures.acousticness * 100 },
                        { name: "Speechiness", value: artistFull.audioFeatures.speechiness * 100 }].map((f) => (
                        <div key={f.name} className="space-y-1">
                          <div className="flex justify-between text-xs"><span className="font-medium">{f.name}</span><span className="text-neutral-500">{Math.round(f.value)}%</span></div>
                          <Progress value={f.value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="h-3 w-16 bg-neutral-100 rounded animate-pulse" /><span className="h-3 w-10 bg-neutral-100 rounded animate-pulse" /></div>
                        <div className="h-1.5 bg-neutral-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="mt-3 pb-4">
              <div className="space-y-2">
                {(generation.refinedPrompts?.length ? generation.refinedPrompts : generation.originalPrompts).map(
                  (p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg bg-white text-sm leading-relaxed break-words hover:bg-neutral-50 transition-colors">
                      <div className="flex-1 min-w-0">{p}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(p)
                            setCopiedIndex(i)
                            setTimeout(() => setCopiedIndex(null), 2000)
                          } catch {}
                        }}
                        className="flex-shrink-0 hover:bg-neutral-100"
                        aria-label="Copy prompt"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className={`mt-3 px-1 break-words ${isScrollable ? "pb-4" : ""}`}>
              {analysis ? (
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-900">Style Summary</p>
                    <p className="leading-relaxed text-neutral-700">{analysis.styleDescription}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-900">Musical Analysis</p>
                    <p className="leading-relaxed text-neutral-700">{analysis.musicalAnalysis}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold text-neutral-900">Key Characteristics</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyCharacteristics.map((c: string) => (
                        <Badge key={c} variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-800">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold text-neutral-900">Suggested Moods</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggestedMoods.map((mood: string) => (
                        <Badge key={mood} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-700">No analysis available.</div>
              )}
            </TabsContent>

            <TabsContent value="tracks" className="mt-3 px-1">
              {artistSpotifyId ? (
                <TopTracksList artistId={artistSpotifyId} limit={8} tracksPrefetched={tracksPrefetched || undefined} />
              ) : (
                <div className="text-sm text-muted-foreground">No Spotify ID available for this artist.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


