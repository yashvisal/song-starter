import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PromptGenerator } from "./prompt-generator"
import { TopTracksList } from "./top-tracks-list"
import type { Artist } from "@/lib/types"
import { Music, Users, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ArtistAnalysisProps {
  artist: Artist
}

export function ArtistAnalysis({ artist }: ArtistAnalysisProps) {
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
                <div className="mt-1 grid grid-cols-3 gap-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{artist.followers.toLocaleString()}</div>
                  <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{artist.popularity}/100</div>
                  <div className="flex items-center gap-1"><Music className="w-3.5 h-3.5" />{Math.round(artist.audioFeatures.tempo)} BPM</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {artist.genres.slice(0, 3).map((g) => (
                    <Badge key={g} variant="secondary" className="rounded-full text-xs">{g}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full border-neutral-200">More details</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-8 pb-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        {/* Left/main: Tabs only */}
        <div className="space-y-6">
          <Tabs defaultValue="prompts" className="w-full">
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="prompts" className="mt-0">
              <PromptGenerator artist={artist as any} initialAnalysis={(artist as any).__initialAnalysis || null} />
            </TabsContent>
            <TabsContent value="analysis" className="mt-0">
              {Boolean((artist as any).__initialAnalysis) ? (
                <Card className="border-neutral-200 rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Musical Analysis</CardTitle>
                    <CardDescription>AI analysis of {artist.name}'s style</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-neutral-700">
                    <div>
                      <h4 className="font-medium mb-2">Style Description</h4>
                      <p className="text-neutral-700">{(artist as any).__initialAnalysis.styleDescription}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Musical Analysis</h4>
                      <p className="text-neutral-700">{(artist as any).__initialAnalysis.musicalAnalysis}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Characteristics</h4>
                      <div className="flex flex-wrap gap-2">
                        {(artist as any).__initialAnalysis.keyCharacteristics.map((c: string) => (
                          <Badge key={c} variant="outline">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Suggested Moods</h4>
                      <div className="flex flex-wrap gap-2">
                        {(artist as any).__initialAnalysis.suggestedMoods.map((m: string) => (
                          <Badge key={m} variant="secondary">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-neutral-200 rounded-2xl shadow-sm">
                  <CardContent className="py-6 text-sm text-neutral-600">Analysis is being prepared…</CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right-side accordion sidebar */}
        <aside>
          <Accordion type="multiple" className="divide-y divide-neutral-200">
            <AccordionItem value="features">
              <AccordionTrigger>Audio Features</AccordionTrigger>
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
              <AccordionTrigger>Top Tracks</AccordionTrigger>
              <AccordionContent>
                <div className="max-h-72 overflow-y-auto pr-1">
                  <TopTracksList artistId={artist.spotifyId} limit={8} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="profile">
              <AccordionTrigger>Profile Details</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-neutral-500 text-xs">Followers</div><div className="font-medium">{artist.followers.toLocaleString()}</div></div>
                  <div><div className="text-neutral-500 text-xs">Popularity</div><div className="font-medium">{artist.popularity}/100</div></div>
                  <div><div className="text-neutral-500 text-xs">Tempo</div><div className="font-medium">{Math.round(artist.audioFeatures.tempo)} BPM</div></div>
                  <div><div className="text-neutral-500 text-xs">Key</div><div className="font-medium">{["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][artist.audioFeatures.key]}</div></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {artist.genres.slice(0, 8).map((g) => (
                    <Badge key={g} variant="secondary" className="rounded-full">{g}</Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>
      </div>
    </section>
  )
}
