"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Copy, Check, ChevronDown, ChevronUp, Calendar, User } from "lucide-react"
import type { Generation } from "@/lib/types"

interface GenerationCardProps {
  generation: Generation
}

export function GenerationCard({ generation }: GenerationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown date"

    const dateObj = date instanceof Date ? date : new Date(date)

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date"
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  }

  const promptsToShow = generation.refinedPrompts.length > 0 ? generation.refinedPrompts : generation.originalPrompts
  const promptType = generation.refinedPrompts.length > 0 ? "Refined" : "Original"

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          {generation.artist?.imageUrl && (
            <img
              src={generation.artist.imageUrl || "/placeholder.svg"}
              alt={generation.artist.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 mb-2">
              <span className="truncate">{generation.artist?.name || "Unknown Artist"}</span>
              <Badge variant="outline">#{generation.id}</Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(generation.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {promptType} Prompts
              </span>
            </CardDescription>
            {generation.artist?.genres && generation.artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {generation.artist.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Preview - First 2 prompts */}
          <div className="space-y-3 mb-4">
            {promptsToShow.slice(0, 2).map((prompt, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{prompt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyPrompt(prompt, index)} className="flex-shrink-0">
                  {copiedIndex === index ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            ))}
          </div>

          {/* Expandable content - Remaining prompts */}
          {promptsToShow.length > 2 && (
            <CollapsibleContent className="space-y-3 mb-4">
              {promptsToShow.slice(2).map((prompt, index) => (
                <div
                  key={index + 2}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 3}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{prompt}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyPrompt(prompt, index + 2)}
                    className="flex-shrink-0"
                  >
                    {copiedIndex === index + 2 ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          )}

          {/* Expand/Collapse trigger */}
          {promptsToShow.length > 2 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full gap-2 text-sm">
                {isExpanded ? (
                  <>
                    Show Less
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show {promptsToShow.length - 2} More Prompts
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      </CardContent>
    </Card>
  )
}
