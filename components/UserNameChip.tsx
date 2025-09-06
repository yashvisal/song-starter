"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ADJECTIVES = [
  "Groovy","Velvet","Neon","Cosmic","Echoing","Lofi","Mellow","Funky","Rhythmic","Sonic","Electric","Wild","Silent","Golden","Velocirous","Wavy","Radiant","Shadow","Mystic","Liquid","Chill","Turbo","Glitchy","Vivid","Lucid","Dreamy","Noisy","Bassline",
]
const NOUNS = [
  "Rhino","Otter","Falcon","Phoenix","Coyote","Tiger","Lion","Raven","Panda","Moose","Wolf","Jaguar","Hawk","Shark","Fox","Bear","Dragon","Synth","808","Melody","Groove","Bass","Echo","Chord","Lyric","Beat","Tempo","Harmony","Note","Track",
]

function pascalCase(a: string, b: string) {
  const aa = a.replace(/[^a-z]/gi, "");
  const bb = b.replace(/[^a-z0-9]/gi, "");
  return aa.charAt(0).toUpperCase() + aa.slice(1) + bb.charAt(0).toUpperCase() + bb.slice(1)
}

async function checkExists(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/username/check?name=${encodeURIComponent(name)}`)
    const data = await res.json()
    return Boolean(data?.exists)
  } catch {
    return false
  }
}

async function registerUsername(name: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/username/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.username || null
  } catch {
    return null
  }
}

function generateCandidate(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return pascalCase(a, n).slice(0, 20)
}

export function UserNameChip() {
  const [name, setName] = useState<string>("")
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem("suno_username") || ""
      if (existing) {
        setName(existing)
      } else {
        // Generate local candidate (best-effort, register lazily on first save or shuffle)
        const cand = generateCandidate()
        setName(cand)
        localStorage.setItem("suno_username", cand)
      }
    } catch {}
  }, [])

  const startEdit = () => {
    setInput(name)
    setEditing(true)
  }

  const submit = async (candidate: string) => {
    const clean = candidate.replace(/[^a-z0-9]/gi, "").slice(0, 20)
    if (clean.length < 3) return
    setSaving(true)
    let finalName = clean
    const exists = await checkExists(finalName)
    if (exists) {
      const suffix = String(Math.floor(7 + Math.random() * 93)).padStart(2, "0")
      finalName = `${finalName}${suffix}`.slice(0, 20)
    }
    const registered = await registerUsername(finalName)
    const chosen = registered || finalName
    try {
      localStorage.setItem("suno_username", chosen)
    } catch {}
    setName(chosen)
    setEditing(false)
    setSaving(false)
  }

  const shuffle = async () => {
    const cand = generateCandidate()
    await submit(cand)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter username"
          className="h-8 w-40"
        />
        <Button size="sm" variant="outline" onClick={() => submit(input)} disabled={saving}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Signed in as</span>
      <Button size="sm" variant="secondary" onClick={startEdit} className="px-3 h-8">
        {name || "Guest"}
      </Button>
      <Button size="sm" variant="ghost" onClick={shuffle} className="h-8">
        Shuffle
      </Button>
    </div>
  )
}


