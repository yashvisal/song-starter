"use client"

import { useState } from "react"
import { ArtistSearch } from "@/components/artist-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import { TypewriterHeader } from "@/components/typewriter-header"

const TRY_NAMES = ["SZA", "Travis Scott", "Billie Eilish"]

export function HomeHero() {
  const [tryName, setTryName] = useState<string>("")

  const handleTry = (name: string) => {
    setTryName(name)
  }

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_30%_-10%,rgba(255,159,28,0.12),transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-4 pt-14 md:pt-20 pb-10 md:pb-16">
        <TypewriterHeader />
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-700">
        Song Starter analyzes your favorite artists to generate prompts for <a href="https://suno.com" target="_blank" rel="noopener noreferrer" className="underline text-orange-500 hover:text-orange-600">Suno</a> that help you create your own music.
        </p>

        {/* Search card using our existing ArtistSearch, styled like the sample */}
        <Card className="mx-auto mt-12 max-w-3xl border-neutral-200 bg-white shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-2 text-sm font-medium text-neutral-800">Search Artist</div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                {/* ArtistSearch with external prefill */}
                <ArtistSearch prefill={tryName} />
              </div>
              {/* Primary CTA handled inside ArtistSearch; this decorative button removed */}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
              <span>Try:</span>
              {TRY_NAMES.map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTry(n)}
                  className="h-7 rounded-full border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                >
                  {n}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}


