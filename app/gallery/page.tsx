import { GalleryView } from "@/components/gallery-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Music } from "lucide-react"
import Link from "next/link"

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Prompt Gallery</h1>
                  <p className="text-sm text-muted-foreground">Explore AI-generated music prompts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <GalleryView />
      </main>
    </div>
  )
}
