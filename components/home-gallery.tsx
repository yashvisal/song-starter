"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GalleryView } from "./gallery-view"

export function HomeGallery() {
  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Prompt Gallery</h2>
        <p className="mt-3 text-neutral-600">Explore prompt packs from the community</p>
      </div>

      <div className="mt-8">
        <GalleryView limit={6} showSearch={false} showMineOnly={false} compact />
      </div>

      <div className="mt-6 text-center">
        <Link href="/gallery">
          <Button variant="outline" className="gap-2 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50">
            Browse full gallery →
          </Button>
        </Link>
      </div>
    </section>
  )
}

