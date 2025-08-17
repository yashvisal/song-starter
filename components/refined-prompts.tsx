"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ArrowLeft, Share, Home } from "lucide-react"
import Link from "next/link"

interface RefinedPromptsProps {
  prompts: string[]
  generationId: number
  artistName: string
  onBack: () => void
}

export function RefinedPrompts({ prompts, generationId, artistName, onBack }: RefinedPromptsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAllPrompts = async () => {
    const allPrompts = prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join("\n\n")
    await navigator.clipboard.writeText(allPrompts)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Refined Prompts
              </CardTitle>
              <CardDescription>Personalized music prompts for {artistName} based on your preferences</CardDescription>
            </div>
            <Badge variant="secondary">Generation #{generationId}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{prompt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyPrompt(prompt, index)} className="flex-shrink-0">
                  {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Generate New Prompts
            </Button>
            <Button onClick={copyAllPrompts} className="gap-2">
              {copiedIndex === -1 ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied All!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All Prompts
                </>
              )}
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share className="w-4 h-4" />
              Share
            </Button>
            <Link href="/">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ready for Suno AI</CardTitle>
          <CardDescription>
            These prompts are optimized for Suno AI. Copy any prompt and paste it directly into Suno to generate your
            music.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tips for best results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use prompts as-is or modify them to fit your vision</li>
              <li>• Try different prompts to explore various styles</li>
              <li>• Combine elements from multiple prompts for unique results</li>
              <li>• Save your favorites and iterate on successful generations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
