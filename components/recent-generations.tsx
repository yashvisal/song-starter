import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRecentGenerations } from "@/lib/database"
import { GenerationCard } from "./generation-card"
import { GalleryThumbnailsIcon as Gallery } from "lucide-react"
import Link from "next/link"

export async function RecentGenerations() {
  const generations = await getRecentGenerations(3)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>Explore what others have created</CardDescription>
          </div>
          <Link href="/gallery">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Gallery className="w-4 h-4" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {generations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gallery className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No generations yet. Be the first to create something amazing!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((generation) => (
              <GenerationCard key={generation.id} generation={generation} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
