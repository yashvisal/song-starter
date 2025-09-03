import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArtistAnalysisResults } from "./artist-analysis-results"
import { PromptGeneration } from "./prompt-generation"
import { TopTracksList } from "./top-tracks-list"
import type { Artist } from "@/lib/types"
import { Music, Users, TrendingUp, ArrowLeft, BarChart3, ListMusic } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ArtistAnalysisProps {
  artist: Artist
  initialAnalysis?: any
  initialGeneration?: any
}

export function ArtistAnalysis({ artist, initialAnalysis, initialGeneration }: ArtistAnalysisProps) {
  const audioFeatures = [
    { name: "Energy", value: artist.audioFeatures.energy * 100, color: "bg-orange-500" },
    { name: "Danceability", value: artist.audioFeatures.danceability * 100, color: "bg-orange-400" },
    { name: "Valence (Happiness)", value: artist.audioFeatures.valence * 100, color: "bg-orange-600" },
    { name: "Acousticness", value: artist.audioFeatures.acousticness * 100, color: "bg-orange-300" },
    { name: "Speechiness", value: artist.audioFeatures.speechiness * 100, color: "bg-orange-200" },
  ]

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_circle_at_30%_-10%,rgba(255,159,28,0.10),transparent_60%)]" />
      {/* Sticky top bar mirroring home header */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-neutral-700">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          {artist.imageUrl && (
            <img src={artist.imageUrl || "/placeholder.svg"} alt={artist.name} className="h-8 w-8 rounded-md object-cover" />
          )}
          <span className="truncate font-medium">{artist.name}</span>
          <div className="ml-auto">
            <Link href="/">
              <Button className="h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 hover:brightness-110">
                Analyze New Artist
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Full-width snapshot card under header */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Card className="border-neutral-200 bg-white/90 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {artist.imageUrl && (
                <img src={artist.imageUrl || "/placeholder.svg"} alt={artist.name} className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-900">{artist.name}</h1>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  <div>
                    <div className="text-[11px] text-neutral-500">Followers</div>
                    <div className="text-sm font-medium text-neutral-900">{artist.followers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500">Popularity</div>
                    <div className="text-sm font-medium text-neutral-900">{artist.popularity}/100</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500">Tempo</div>
                    <div className="text-sm font-medium text-neutral-900">{Math.round(artist.audioFeatures.tempo)} BPM</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-500">Key</div>
                    <div className="text-sm font-medium text-neutral-900">{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][artist.audioFeatures.key]}</div>
                  </div>
                </div>
                {/* Genres removed from snapshot per request */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-8 pb-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        {/* Left/main: Tabs only */}
        <div className="space-y-6">
          <Tabs defaultValue="analysis" className="w-full">
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="refined">Personalize</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="analysis" className="mt-0">
              <ArtistAnalysisResults analysis={initialAnalysis} artistName={artist.name} />
            </TabsContent>
            <TabsContent value="prompts" className="mt-0">
              <PromptGeneration artist={artist as any} initialAnalysis={initialAnalysis} mode="prompts" />
            </TabsContent>
            <TabsContent value="refined" className="mt-0">
              <PromptGeneration 
                artist={artist as any} 
                initialAnalysis={initialAnalysis} 
                initialRefinedPrompts={initialGeneration?.refinedPrompts || []}
                initialGenerationId={initialGeneration?.id || 0}
                mode="personalize" 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right-side accordion sidebar */}
        <aside>
          <Accordion type="multiple" className="divide-y divide-neutral-200">
            <AccordionItem value="features">
              <AccordionTrigger>
                <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-neutral-500" />Audio Features</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {audioFeatures.map((f) => (
                    <div key={f.name} className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="font-medium">{f.name}</span><span className="text-neutral-500">{Math.round(f.value)}%</span></div>
                      <Progress value={f.value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tracks">
              <AccordionTrigger>
                <div className="flex items-center gap-2"><ListMusic className="w-4 h-4 text-neutral-500" />Top Tracks</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-72 overflow-y-auto pr-1">
                  <TopTracksList artistId={artist.spotifyId} limit={8} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>
      </div>
    </section>
  )
}
