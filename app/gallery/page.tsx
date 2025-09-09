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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <GalleryView />
      </main>
    </div>
  )
}

