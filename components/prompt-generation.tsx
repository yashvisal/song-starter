"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Copy, Check, X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { QuestionInterface } from "./question-interface"
import { RefinedPrompts } from "./refined-prompts"
import type { Artist, UserQuestion } from "@/lib/types"
import type { AnalysisResult } from "@/lib/llm"

interface PromptGenerationProps {
  artist: Artist
  initialAnalysis?: AnalysisResult | null
}

type ViewState = "initial" | "prompts" | "questions" | "refined"

export function PromptGeneration({ artist, initialAnalysis = null }: PromptGenerationProps) {
  const [viewState, setViewState] = useState<ViewState>(initialAnalysis ? "prompts" : "initial")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [refinedPrompts, setRefinedPrompts] = useState<string[]>([])
  const [generationId, setGenerationId] = useState<number>(0)
  const autoRunFor = useRef<string | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)

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
        setViewState("prompts")
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

  // Removed client-side initial persistence; should be done server-side

  const handlePersonalize = () => {
    setShowQuestions(true)
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
          generationId: generationId || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setRefinedPrompts(result.refinedPrompts)
        setGenerationId(result.generationId)
        // persist in local state so tab switches keep refined view
        setAnalysis((prev) => prev)
        setShowQuestions(false)
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

  const handleBackToPrompts = () => {
    setViewState("prompts")
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
      <Card className="border-neutral-200 bg-white rounded-2xl pt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Preparing Prompts
          </CardTitle>
          <CardDescription>Analyzing {artist.name}'s style to generate ready-to-use prompts</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating initial prompts…
          </div>
        </CardContent>
      </Card>
    )
  }

  // Questions interface now shown as modal; keep legacy path unused

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

  // Generated prompts view
  if (viewState === "prompts" && analysis) {
    return (
      <div className="space-y-6">
        {/* Generated Prompts */}
        <Card className="border-neutral-200 bg-white rounded-2xl pt-6">
          <CardHeader>
            <CardTitle>Generated Prompts</CardTitle>
            <CardDescription>10 AI-generated music prompts ready for Suno AI</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid gap-3">
              {analysis.initialPrompts.map((prompt, index) => (
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyPrompt(prompt, index)} 
                    className="flex-shrink-0 hover:bg-neutral-100"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <Button onClick={handlePersonalize} className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:brightness-110" size="lg">
                <Sparkles className="w-5 h-5" />
                Personalize These Prompts
              </Button>
              <p className="text-sm text-neutral-600 text-center mt-2">
                Answer a few questions to refine these prompts to your specific needs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personalize modal */}
        <Dialog.Root open={showQuestions} onOpenChange={setShowQuestions}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <div className="relative w-full max-w-2xl">
                <Dialog.Title className="sr-only">Personalization Questions</Dialog.Title>
                <Dialog.Description className="sr-only">Answer a few questions to refine your prompts</Dialog.Description>
                <QuestionInterface
                  questions={analysis.questions}
                  onComplete={handleQuestionsComplete}
                  onBack={() => setShowQuestions(false)}
                  onClose={() => setShowQuestions(false)}
                  isRefining={isRefining}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    )
  }

  return null
}
