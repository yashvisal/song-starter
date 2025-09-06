"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const EXAMPLES = [
  {
    tags: ["Trap", "142 BPM", "confident"],
    text:
      "rap + trap | 142 BPM | mood: cold, confident | instrumentation: 808s, crisp hats, detuned bell, sub bass | groove: half-time swing | vocals: male gritty | hook: ‘started in the silence’ | production: tight low-end, wide stereo",
  },
  {
    tags: ["R&B", "86 BPM", "late‑night"],
    text:
      "r&b + alt pop | 86 BPM | mood: late-night, intimate | instrumentation: Rhodes, warm bass, brushed kit, airy pads | groove: laid-back pocket | vocals: airy | hook: ‘missed calls past midnight’ | production: tape warmth, plate verb",
  },
  {
    tags: ["Indie Pop", "112 BPM", "hopeful"],
    text:
      "indie pop | 112 BPM | mood: hopeful, glossy | instrumentation: plucky synth, bass guitar, tight kick, claps | groove: four-on-the-floor | vocals: female soft | hook: ‘run through the city lights’ | production: clean top-end, subtle sidechain",
  },
]

export function SamplePrompts() {
  const [copied, setCopied] = useState<number | null>(null)

  const copyText = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(index)
      setTimeout(() => setCopied(null), 1200)
    } catch {}
  }

  return (
    <section id="preview" className="mx-auto max-w-6xl px-4 py-16">
      {/* REMOVABLE_SECTION_START: sample prompts section */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Sample prompts</h2>
        <p className="mt-3 text-neutral-600">A taste of what a pack looks like. Real packs include 10 varied prompts.</p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXAMPLES.map((p, i) => (
          <Card key={i} className="rounded-2xl border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {p.tags.map((t, j) => (
                <span
                  key={j}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-800"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">{p.text}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                onClick={() => copyText(p.text, i)}
                variant="outline"
                className="h-9 gap-2 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              >
                {copied === i ? "Copied!" : "Copy"}
              </Button>
              <a
                href="https://suno.com/create"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-full px-3 text-xs text-orange-600 hover:text-orange-700"
              >
                Open in Suno →
              </a>
            </div>
          </Card>
        ))}
      </div>
      {/* REMOVABLE_SECTION_END */}
    </section>
  )
}


