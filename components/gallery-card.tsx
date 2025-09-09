"use client"

import { memo } from "react"
import type { Generation } from "@/lib/types"

interface GalleryCardProps {
  generation: Generation
  onSelect?: (generation: Generation) => void
}

export const GalleryCard = memo(function GalleryCard({ generation, onSelect }: GalleryCardProps) {
  const promptCount = (generation.refinedPrompts?.length || generation.originalPrompts?.length || 0)

  return (
    <button
      onClick={() => onSelect?.(generation)}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
    >
      <div className="relative aspect-[16/10] w-full">
        {generation.artist?.imageUrl ? (
          <img
            src={generation.artist.imageUrl || "/placeholder.svg"}
            alt={generation.artist?.name || "Artist"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <h4 className="text-base font-medium text-white drop-shadow">{generation.artist?.name || "Unknown Artist"}</h4>
            <p className="mt-0.5 text-[12px] text-neutral-200/90 drop-shadow">
              {generation.userId ? `by ${generation.userId}` : "Community"}
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-neutral-800 border border-white/90">
            {promptCount} prompts
          </span>
        </div>
      </div>
      {/* Intentionally no footer content to keep card compact in gallery */}
    </button>
  )
})


