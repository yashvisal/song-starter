"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Sparkles, Loader2, X } from "lucide-react"
import type { UserQuestion } from "@/lib/types"

interface QuestionInterfaceProps {
  questions: UserQuestion[]
  onComplete: (answers: UserQuestion[]) => void
  onBack: () => void
  isRefining?: boolean
  onClose?: () => void
}

export function QuestionInterface({ questions, onComplete, onBack, isRefining = false, onClose }: QuestionInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<UserQuestion[]>(questions.map((q) => ({ ...q, answer: "" })))

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const updateAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = { ...newAnswers[currentQuestionIndex], answer }
    setAnswers(newAnswers)
  }

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      onComplete(answers)
    }
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const currentAnswer = answers[currentQuestionIndex]?.answer || ""
  const canProceed = currentAnswer.trim() !== ""
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestionIndex]?.answer || ""

    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <RadioGroup value={currentAnswer} onValueChange={updateAnswer} className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "scale":
        const scaleValue = currentAnswer ? [Number.parseInt(currentAnswer)] : [5]
        return (
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={scaleValue}
                onValueChange={(value) => updateAnswer(value[0].toString())}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground px-3">
              <span>1 (Not at all)</span>
              <span className="font-medium text-foreground">{currentAnswer || "5"}</span>
              <span>10 (Extremely)</span>
            </div>
          </div>
        )

      case "text":
      default:
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px] resize-none"
          />
        )
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-2xl gap-3">
      <CardHeader className="relative pt-4 pb-1">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">Personalization Questions</CardTitle>
          <span className="text-sm text-muted-foreground">{currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardDescription>
          Help us refine your music prompts by answering a few questions about your preferences
        </CardDescription>
        <button
          onClick={onClose || onBack}
          aria-label="Close"
          className="absolute right-6 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-6 pt-0 pb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium leading-relaxed">{currentQuestion.question}</h3>
          {renderQuestionInput()}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={currentQuestionIndex === 0 ? onBack : goToPrevious}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentQuestionIndex === 0 ? "Back to Prompts" : "Previous"}
          </Button>

          <Button onClick={goToNext} disabled={isRefining} className="gap-2">
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refining...
              </>
            ) : isLastQuestion ? (
              <>
                <Sparkles className="w-4 h-4" />
                Refine Prompts
              </>
            ) : (
              <>
                {canProceed ? "Next" : "Skip"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
