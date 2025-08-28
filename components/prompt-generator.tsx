"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { QuestionInterface } from "./question-interface"
import { RefinedPrompts } from "./refined-prompts"
import type { Artist, UserQuestion } from "@/lib/types"
import type { AnalysisResult } from "@/lib/llm"

interface PromptGeneratorProps {
  artist: Artist
  initialAnalysis?: AnalysisResult | null
}

type ViewState = "initial" | "analysis" | "questions" | "refined"

export function PromptGenerator({ artist, initialAnalysis = null }: PromptGeneratorProps) {
  const [viewState, setViewState] = useState<ViewState>(initialAnalysis ? "analysis" : "initial")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [refinedPrompts, setRefinedPrompts] = useState<string[]>([])
  const [generationId, setGenerationId] = useState<number>(0)
  const autoRunFor = useRef<string | null>(null)

  // If server provided analysis, show it immediately (state already initialized)

  const handleGeneratePrompts = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/analyze-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.spotifyId }),
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
        setViewState("analysis")
      } else {
        console.error("Failed to analyze artist")
      }
    } catch (error) {
      console.error("Analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-trigger initial prompt generation when the component mounts per artist
  useEffect(() => {
    if (autoRunFor.current !== artist.spotifyId && !analysis && !isAnalyzing && !initialAnalysis) {
      autoRunFor.current = artist.spotifyId
      handleGeneratePrompts()
    }
  }, [artist.spotifyId, initialAnalysis])

  // Save initial generation once when analysis is ready
  const savedInitialRef = useRef(false)
  useEffect(() => {
    async function saveInitial() {
      if (!analysis || savedInitialRef.current) return
      savedInitialRef.current = true
      let userId = ""
      try { userId = localStorage.getItem("suno_username") || "" } catch {}
      try {
        await fetch("/api/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artistId: artist.id,
            userId: userId || null,
            userQuestions: [],
            originalPrompts: analysis.initialPrompts,
            refinedPrompts: [],
            generationMetadata: { analysisData: analysis, timestamp: new Date().toISOString(), processingTime: 0, phase: "initial" },
          }),
        })
      } catch {}
    }
    saveInitial()
  }, [analysis, artist.id])

  const handlePersonalize = () => {
    setViewState("questions")
  }

  const handleQuestionsComplete = async (answers: UserQuestion[]) => {
    if (!analysis) return

    setIsRefining(true)
    try {
      const response = await fetch("/api/refine-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.spotifyId,
          originalAnalysis: analysis,
          userAnswers: answers,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setRefinedPrompts(result.refinedPrompts)
        setGenerationId(result.generationId)
        setViewState("refined")
      } else {
        console.error("Failed to refine prompts")
      }
    } catch (error) {
      console.error("Refinement error:", error)
    } finally {
      setIsRefining(false)
    }
  }

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleBackToAnalysis = () => {
    setViewState("analysis")
  }

  const handleStartOver = () => {
    setViewState("initial")
    setAnalysis(null)
    setRefinedPrompts([])
    setGenerationId(0)
  }

  // Initial state - no analysis yet
  if (viewState === "initial") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Preparing Prompts
          </CardTitle>
          <CardDescription>Analyzing {artist.name}'s style to generate ready-to-use prompts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating initial prompts…
          </div>
        </CardContent>
      </Card>
    )
  }

  // Questions interface
  if (viewState === "questions" && analysis) {
    return (
      <QuestionInterface
        questions={analysis.questions}
        onComplete={handleQuestionsComplete}
        onBack={handleBackToAnalysis}
        isRefining={isRefining}
      />
    )
  }

  // Refined prompts view
  if (viewState === "refined") {
    return (
      <RefinedPrompts
        prompts={refinedPrompts}
        generationId={generationId}
        artistName={artist.name}
        onBack={handleStartOver}
      />
    )
  }

  // Analysis results with initial prompts
  if (viewState === "analysis" && analysis) {
    return (
      <div className="space-y-6">
        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Musical Analysis</CardTitle>
                <CardDescription>AI analysis of {artist.name}'s style</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Style Description</h4>
              <p className="text-muted-foreground">{analysis.styleDescription}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Musical Analysis</h4>
              <p className="text-muted-foreground">{analysis.musicalAnalysis}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Characteristics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyCharacteristics.map((characteristic) => (
                  <Badge key={characteristic} variant="outline">
                    {characteristic}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Suggested Moods</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedMoods.map((mood) => (
                  <Badge key={mood} variant="secondary">
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Prompts */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Prompts</CardTitle>
            <CardDescription>10 AI-generated music prompts ready for Suno AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {analysis.initialPrompts.map((prompt, index) => (
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
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <Button onClick={handlePersonalize} className="w-full gap-2" size="lg">
                <Sparkles className="w-5 h-5" />
                Personalize These Prompts
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Answer a few questions to refine these prompts to your specific needs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
