import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PromptGenerator } from "./prompt-generator"
import { TopTracksList } from "./top-tracks-list"
import type { Artist } from "@/lib/types"
import { Music, Users, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ArtistAnalysisProps {
  artist: Artist
}

export function ArtistAnalysis({ artist }: ArtistAnalysisProps) {
  const audioFeatures = [
    { name: "Energy", value: artist.audioFeatures.energy * 100, color: "bg-red-500" },
    { name: "Danceability", value: artist.audioFeatures.danceability * 100, color: "bg-green-500" },
    { name: "Valence (Happiness)", value: artist.audioFeatures.valence * 100, color: "bg-yellow-500" },
    { name: "Acousticness", value: artist.audioFeatures.acousticness * 100, color: "bg-blue-500" },
    { name: "Speechiness", value: artist.audioFeatures.speechiness * 100, color: "bg-pink-500" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-shrink-0">
            {artist.imageUrl && (
              <img
                src={artist.imageUrl || "/placeholder.svg"}
                alt={artist.name}
                className="w-48 h-48 rounded-lg object-cover shadow-lg"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-foreground">{artist.name}</h1>
              <Button asChild variant="ghost" size="sm" className="p-1 h-8 w-8">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {artist.genres.slice(0, 4).map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{artist.followers.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Popularity: {artist.popularity}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{Math.round(artist.audioFeatures.tempo)} BPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Features Analysis */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Audio Features</CardTitle>
              <CardDescription>Musical characteristics based on top tracks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioFeatures.map((feature) => (
                <div key={feature.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-muted-foreground">{Math.round(feature.value)}%</span>
                  </div>
                  <Progress value={feature.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Musical Profile</CardTitle>
              <CardDescription>Key characteristics and style indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Key</div>
                  <div className="text-2xl font-bold text-primary">
                    {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][artist.audioFeatures.key]}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Mode</div>
                  <div className="text-2xl font-bold text-primary">
                    {artist.audioFeatures.mode === 1 ? "Major" : "Minor"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Time Signature</div>
                  <div className="text-2xl font-bold text-primary">{artist.audioFeatures.time_signature}/4</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Loudness</div>
                  <div className="text-2xl font-bold text-primary">{Math.round(artist.audioFeatures.loudness)} dB</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Tempo</div>
                  <div className="text-2xl font-bold text-primary">{Math.round(artist.audioFeatures.tempo)} BPM</div>
                </div>
                {typeof artist.audioFeatures.duration_ms === "number" && (
                  <div>
                    <div className="text-sm font-medium mb-1">Avg Duration</div>
                    <div className="text-2xl font-bold text-primary">
                      {Math.floor((artist.audioFeatures.duration_ms / 1000) / 60)}:{String(Math.round((artist.audioFeatures.duration_ms / 1000) % 60)).padStart(2, "0")}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Popular tracks by the artist</CardDescription>
            </CardHeader>
            <CardContent>
              <TopTracksList artistId={artist.spotifyId} limit={8} />
            </CardContent>
          </Card>

          <div className="lg:col-span-1">
            <PromptGenerator artist={artist} />
          </div>
        </div>
      </div>
    </div>
  )
}
