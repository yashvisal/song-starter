import { GalleryView } from "@/components/gallery-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { UserNameChip } from "@/components/UserNameChip"
import Link from "next/link"

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-neutral-700">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="truncate font-medium">Prompt Gallery</span>
          <div className="ml-auto">
            <UserNameChip />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="mx-auto max-w-3xl text-center mb-6 md:mb-8">
          <h1 className="text-[24px] md:text-[28px] font-semibold tracking-tight text-neutral-900">Explore the Prompt Gallery</h1>
          <p className="mx-auto mt-2 md:mt-2 max-w-2xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
            Discover community-made prompt packs to spark ideas. Open an artist to see analysis, prompts, and top tracks.
          </p>
        </section>

        <GalleryView />
      </main>
    </div>
  )
}

