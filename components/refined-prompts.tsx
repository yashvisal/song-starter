"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
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
      <Card className="border-neutral-200 bg-white rounded-2xl pt-6">
        <CardHeader>
          <CardTitle>Refined Prompts</CardTitle>
          <CardDescription>Personalized music prompts for {artistName} based on your preferences</CardDescription>
          <CardAction>
            <Badge variant="secondary">Generation #{generationId}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid gap-3">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed text-neutral-800">{prompt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyPrompt(prompt, index)} className="flex-shrink-0 hover:bg-neutral-100">
                  {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
      <Card className="border-neutral-200 bg-white rounded-2xl pt-6">
        <CardHeader>
          <CardTitle className="text-lg">Ready for Suno AI</CardTitle>
          <CardDescription>
            These prompts are optimized for Suno AI. Copy any prompt and paste it directly into Suno to generate your
            music.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tips for best results:</h4>
            <ul className="text-sm text-neutral-600 space-y-1">
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
