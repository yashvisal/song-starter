"use client"

import { useState } from "react"
import { ArtistSearch } from "@/components/artist-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const TRY_NAMES = ["SZA", "Travis Scott", "Billie Eilish"]

export function HomeHero() {
  const [busyTry, setBusyTry] = useState<string>("")
  const router = useRouter()

  const handleTry = async (name: string) => {
    setBusyTry(name)
    try {
      const res = await fetch(`/api/search-artists?q=${encodeURIComponent(name)}`)
      const artists = await res.json()
      if (Array.isArray(artists) && artists[0]?.id) {
        router.push(`/artist/${artists[0].id}`)
      }
    } catch {
    } finally {
      setBusyTry("")
    }
  }

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_30%_-10%,rgba(255,159,28,0.12),transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <h1 className="text-center text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
          Create Personalized Music with AI
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
          Analyze any Spotify artist and generate Suno‑ready prompts tailored to their style and your vision.
        </p>

        {/* Search card using our existing ArtistSearch */}
        <Card className="mx-auto mt-10 max-w-3xl border-neutral-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium text-neutral-800">Search Artist</div>
            <ArtistSearch />
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
              <span>Try:</span>
              {TRY_NAMES.map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTry(n)}
                  className="h-7 rounded-full border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                  disabled={!!busyTry}
                >
                  {busyTry === n ? "Loading…" : n}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}


