import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArtistSearch } from "@/components/artist-search"
import { RecentGenerations } from "@/components/recent-generations"
import { Search, Music, GalleryThumbnailsIcon as Gallery } from "lucide-react"
import Link from "next/link"
import { UserNameChip } from "@/components/UserNameChip"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Suno Producer Test!</h1>
                <p className="text-sm text-muted-foreground">AI Music Prompt Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserNameChip />
              <Link href="/gallery">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Gallery className="w-4 h-4" />
                  Browse Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Create Personalized Music with AI</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Analyze any Spotify artist and generate custom AI music prompts tailored to their style and your creative
            vision.
          </p>
        </div>

        {/* Artist Search Section */}
        <Card className="max-w-2xl mx-auto mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Artist
            </CardTitle>
            <CardDescription>Enter a Spotify artist name to begin analyzing their musical style</CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistSearch />
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deep Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Extract audio features, genres, and musical patterns from Spotify data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Personalization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Answer interactive questions to refine and personalize your music prompts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ready for Suno</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Get 10 diverse, production-ready prompts optimized for Suno AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Generations Preview */}
        <RecentGenerations />
      </main>
    </div>
  )
}
