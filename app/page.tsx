import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserNameChip } from "@/components/UserNameChip"
import { HomeHero } from "@/components/home-hero"
import { HomeGallery } from "@/components/home-gallery"
import { SamplePrompts } from "@/components/sample-prompts"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-orange-500 to-orange-600" />
            <span className="font-medium tracking-tight">Suno Producer</span>
          </div>
          <nav className="flex items-center gap-4 md:gap-6 text-sm text-neutral-600">
            <a href="#gallery" className="hover:text-neutral-900">Gallery</a>
            <UserNameChip />
            <Link href="/gallery">
              <Button variant="outline" className="h-8 gap-2 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50">
                Browse
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + Search */}
      <HomeHero />

      {/* Gallery (light version with modal) */}
      <HomeGallery />

      {/* Sample prompts (removable) */}
      <SamplePrompts />

      {/* FAQ (removable) */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        {/* REMOVABLE_SECTION_START: FAQ */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">FAQ</h2>
        </div>
        <div className="mt-6 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {[
            { q: "Do I need Spotify Premium?", a: "No—Suno Producer uses public artist data from Spotify's Web API." },
            { q: "Do I need a Suno account?", a: "You’ll paste prompts into Suno to generate music." },
            { q: "Are these prompts deterministic?", a: "No—prompts are LLM‑driven for creative variety." },
            { q: "Are you affiliated with Spotify or Suno?", a: "No—this is an independent tool. Prompts are ‘inspired by’ public musical traits." },
          ].map((item, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                <span>{item.q}</span>
                <span className="text-neutral-500 transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-neutral-600">{item.a}</p>
            </details>
          ))}
        </div>
        {/* REMOVABLE_SECTION_END */}
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-neutral-600 md:flex-row">
          <div>© {new Date().getFullYear()} Suno Producer</div>
          <div className="flex items-center gap-6">
            <a href="#gallery" className="hover:text-neutral-900">Gallery</a>
            <a href="#preview" className="hover:text-neutral-900">Samples</a>
            <a href="#" className="hover:text-neutral-900">FAQ</a>
          </div>
          <div className="text-xs">Prompts are “inspired by” public musical traits. Not affiliated with Spotify or Suno.</div>
        </div>
      </footer>
    </main>
  )
}
