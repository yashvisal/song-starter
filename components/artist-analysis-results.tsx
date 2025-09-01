"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AnalysisResult } from "@/lib/llm"

interface ArtistAnalysisResultsProps {
  analysis: AnalysisResult | null
  artistName: string
}

export function ArtistAnalysisResults({ analysis, artistName }: ArtistAnalysisResultsProps) {
  if (!analysis) {
    return (
      <Card className="border-neutral-200 bg-white rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="text-neutral-600">No analysis available yet.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Results */}
      <Card className="border-neutral-200 bg-white rounded-2xl">
        <CardHeader>
          <CardTitle>Musical Analysis</CardTitle>
          <CardDescription>AI analysis of {artistName}'s style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-neutral-900">Style Description</h4>
            <p className="text-neutral-700 leading-relaxed">{analysis.styleDescription}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-neutral-900">Musical Analysis</h4>
            <p className="text-neutral-700 leading-relaxed">{analysis.musicalAnalysis}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-neutral-900">Key Characteristics</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keyCharacteristics.map((characteristic) => (
                <Badge key={characteristic} variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-800">
                  {characteristic}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-neutral-900">Suggested Moods</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedMoods.map((mood) => (
                <Badge key={mood} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  {mood}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
