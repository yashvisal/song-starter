"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Generation } from "@/lib/types"

interface ModalGen {
  id: number
  artist?: { name: string; imageUrl: string }
  userId?: string
  createdAt: Date
  refinedPrompts: string[]
  originalPrompts: string[]
}

export function HomeGallery() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ModalGen | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const q = new URLSearchParams({ limit: "6" }).toString()
        const res = await fetch(`/api/generations?${q}`)
        const data = await res.json()
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const openModal = (g: Generation) => {
    setActive({
      id: g.id,
      artist: g.artist ? { name: g.artist.name, imageUrl: g.artist.imageUrl } : undefined,
      userId: g.userId,
      createdAt: g.createdAt,
      refinedPrompts: g.refinedPrompts,
      originalPrompts: g.originalPrompts,
    })
  }

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Prompt Gallery</h2>
        <p className="mt-3 text-neutral-600">Explore prompt packs from the community</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl border border-neutral-200 bg-neutral-50 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-neutral-600">No generations yet</Card>
        ) : (
          items.map((g) => (
            <button
              key={g.id}
              onClick={() => openModal(g)}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <div className="relative aspect-[16/10] w-full">
                {g.artist?.imageUrl ? (
                  <img src={g.artist.imageUrl || "/placeholder.svg"} alt={g.artist?.name || "Artist"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-neutral-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h4 className="text-base font-medium text-white drop-shadow">{g.artist?.name || "Unknown Artist"}</h4>
                    <p className="mt-0.5 text-[12px] text-neutral-200/90 drop-shadow">
                      {g.userId ? `by ${g.userId}` : "Community"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-neutral-800 border border-white/90">
                    {(g.refinedPrompts?.length || g.originalPrompts?.length || 0)} prompts
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                  {g.refinedPrompts.slice(0, 1).map((p, i) => (
                    <span key={i} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-800">
                      Refined
                    </span>
                  ))}
                  {g.originalPrompts.length > 0 && (
                    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-800">
                      {`${Math.max(1, g.originalPrompts[0].split("|")[1]?.trim() || "BPM").toString().slice(0, 8)}`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/gallery">
          <Button variant="outline" className="gap-2 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50">
            Browse full gallery →
          </Button>
        </Link>
      </div>

      {/* Basic Modal – v1 placeholder to extend later */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6"
          onClick={() => setActive(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-neutral-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-medium text-neutral-900">
                  {active.artist?.name || "Prompt Pack"}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {active.userId ? `by ${active.userId}` : "Community"}
                </p>
              </div>
              <Button
                onClick={() => setActive(null)}
                variant="outline"
                className="h-9 gap-2 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                aria-label="Close"
              >
                Close
              </Button>
            </div>
            <div className="p-5">
              {/* REMOVABLE_SECTION_START: modal placeholder content */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Modal placeholder — generation details to come.
              </div>
              {/* REMOVABLE_SECTION_END */}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


