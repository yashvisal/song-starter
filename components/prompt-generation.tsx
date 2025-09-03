"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
  mode?: "prompts" | "personalize"
  initialRefinedPrompts?: string[]
  initialGenerationId?: number
}

type ViewState = "initial" | "prompts" | "questions" | "refined"

export function PromptGeneration({ artist, initialAnalysis = null, mode = "prompts", initialRefinedPrompts = [], initialGenerationId = 0 }: PromptGenerationProps) {
  const [viewState, setViewState] = useState<ViewState>(initialAnalysis ? "prompts" : "initial")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [refinedPrompts, setRefinedPrompts] = useState<string[]>([])
  const [generationId, setGenerationId] = useState<number>(0)
  const autoRunFor = useRef<string | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [isHydratingLatest, setIsHydratingLatest] = useState(true)

  // Removed client-side analysis LLM call; server should provide analysis

  // Auto-trigger initial prompt generation when the component mounts per artist
  useEffect(() => {
    // If server provided analysis, set it; never call LLM here
    if (initialAnalysis && !analysis) {
      setAnalysis(initialAnalysis)
      setViewState("prompts")
    }
  }, [initialAnalysis])

  // If server pre-hydrated refined prompts, set them immediately to avoid flicker
  useEffect(() => {
    if (Array.isArray(initialRefinedPrompts) && initialRefinedPrompts.length > 0) {
      setRefinedPrompts(initialRefinedPrompts)
      if (!generationId && initialGenerationId) setGenerationId(initialGenerationId)
      if (mode === "personalize") setViewState("refined")
      // Persist to localStorage so client navigations can hydrate without flicker
      try {
        localStorage.setItem(`refined_prompts_${artist.id}`, JSON.stringify(initialRefinedPrompts))
        if (initialGenerationId) localStorage.setItem(`generation_id_${artist.id}`, String(initialGenerationId))
      } catch {}
    }
  }, [initialRefinedPrompts, initialGenerationId, mode])

  // Pre-hydrate from localStorage before first paint to eliminate CTA→refined flicker in personalize mode
  useLayoutEffect(() => {
    if (mode !== "personalize") return
    try {
      const cached = localStorage.getItem(`refined_prompts_${artist.id}`)
      const cachedGenId = localStorage.getItem(`generation_id_${artist.id}`)
      if (cached) {
        const arr = JSON.parse(cached)
        if (Array.isArray(arr) && arr.length > 0) {
          setRefinedPrompts(arr)
          if (!generationId && cachedGenId) setGenerationId(Number(cachedGenId))
          setViewState("refined")
          setIsHydratingLatest(false)
        }
      }
    } catch {}
  }, [artist.id, mode])


  // Fetch latest generation to hydrate analysis/prompts from DB.
  // In prompts mode: request artist-scoped generation (no user param) to maximize hit rate.
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setIsHydratingLatest(true)
        const params = new URLSearchParams()
        params.set("artistId", artist.id)
        if (mode === "personalize") {
          try {
            const u = localStorage.getItem("suno_username")
            if (u) params.set("user", u)
          } catch {}
        }
        const res = await fetch(`/api/generations/latest?${params.toString()}`)
        if (!res.ok) return
        const gen = await res.json()
        if (cancelled || !gen) return
        if (!generationId && gen.id) setGenerationId(Number(gen.id))
        if (!analysis && gen.generationMetadata?.analysisData) {
          setAnalysis(gen.generationMetadata.analysisData)
          if (mode === "prompts") setViewState("prompts")
        }
        if (mode === "personalize") {
          if (Array.isArray(gen.refinedPrompts) && gen.refinedPrompts.length > 0) {
            setRefinedPrompts(gen.refinedPrompts)
            setViewState("refined")
          }
        }
      } catch {}
      finally {
        if (!cancelled) setIsHydratingLatest(false)
      }
    }
    // Skip fetch if we already have refined prompts (SSR-provided) to avoid flicker
    if (mode === "personalize" && refinedPrompts.length > 0) {
      setIsHydratingLatest(false)
      return
    }
    // In prompts mode, only fetch if analysis is missing
    if (mode === "prompts" && analysis) {
      setIsHydratingLatest(false)
      return
    }
    run()
    return () => {
      cancelled = true
    }
  }, [artist.id, mode])

  const handlePersonalize = () => {
    setShowQuestions(true)
  }

  const handleQuestionsComplete = async (answers: UserQuestion[]) => {
    if (!analysis) return

    setIsRefining(true)
    try {
      let userId = ""
      try { userId = localStorage.getItem("suno_username") || "" } catch {}
      const response = await fetch("/api/refine-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.spotifyId,
          originalAnalysis: analysis,
          userAnswers: answers,
          generationId: generationId || undefined,
          userId: userId || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setRefinedPrompts(result.refinedPrompts)
        setGenerationId(result.generationId)
        // persist in local state so tab switches keep refined view
        setAnalysis((prev) => prev)
        try {
          localStorage.setItem(`refined_prompts_${artist.id}`, JSON.stringify(result.refinedPrompts || []))
          localStorage.setItem(`generation_id_${artist.id}`, String(result.generationId || 0))
        } catch {}
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

  // Refined prompts view (standalone or personalize tab hydrated)
  if ((viewState === "refined" || mode === "personalize") && refinedPrompts.length > 0) {
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
  if (mode === "prompts" && viewState === "prompts" && analysis) {
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

  // Personalize tab: no refined prompts yet → CTA with modal
  if (mode === "personalize" && refinedPrompts.length === 0 && analysis) {
    return (
      <div className="space-y-6">
        <Card className="border-neutral-200 bg-white rounded-2xl pt-6">
          <CardHeader>
            <CardTitle>Personalize Your Prompts</CardTitle>
            <CardDescription>Answer a few quick questions to tailor these prompts to your goals.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="mt-2">
              <Button onClick={handlePersonalize} className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:brightness-110" size="lg">
                <Sparkles className="w-5 h-5" />
                Start Personalization
              </Button>
              <p className="text-sm text-neutral-600 text-center mt-2">
                We’ll refine 10 prompts based on your choices. This takes just a minute.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
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
