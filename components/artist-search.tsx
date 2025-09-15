"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Sparkles, Loader2 } from "lucide-react"
import type { SpotifyArtist } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ArtistSearchProps {
  onArtistSelect?: (artist: SpotifyArtist) => void
  prefill?: string
}

export function ArtistSearch({ onArtistSelect, prefill }: ArtistSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SpotifyArtist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const compactNumber = useMemo(
    () => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }),
    []
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchArtists = async () => {
      if (query.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search-artists?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const artists = await response.json()
          setResults(artists)
          setShowResults(true)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchArtists, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  // Accept external prefill for Try chips without navigating
  useEffect(() => {
    if (typeof prefill === "string" && prefill && prefill !== query) {
      setQuery(prefill)
      setShowResults(true)
      setSelectedIndex(-1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleArtistSelect(results[selectedIndex])
        }
        break
      case "Escape":
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleArtistSelect = (artist: SpotifyArtist) => {
    setQuery(artist.name)
    setShowResults(false)
    if (onArtistSelect) {
      onArtistSelect(artist)
    } else {
      // Ensure username cookie mirrors localStorage before server navigation
      try {
        const hasCookie = document.cookie.includes("suno_username=")
        if (!hasCookie) {
          const u = localStorage.getItem("suno_username")
          if (u) {
            document.cookie = `suno_username=${encodeURIComponent(u)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
          }
        }
      } catch {}
      router.push(`/artist/${artist.id}`)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="e.g., Taylor Swift, Drake, Billie Eilish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            className="h-10 rounded-xl border-neutral-200 bg-neutral-50 pl-10 pr-4 text-[15px] placeholder:text-neutral-500 focus-visible:ring-orange-500/30"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />
          )}
        </div>
        <Button
          className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 gap-2 hover:brightness-110"
          disabled={!query.trim() || isLoading}
          onClick={() => (selectedIndex >= 0 ? handleArtistSelect(results[selectedIndex]) : null)}
        >
          <Sparkles className="w-4 h-4" />
          Analyze
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto border-neutral-200 bg-white shadow-md rounded-xl">
          <CardContent className="p-0">
            {results.map((artist, index) => (
              <button
                key={artist.id}
                onClick={() => handleArtistSelect(artist)}
                className={`w-full px-3 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? "bg-neutral-50" : ""
                } ${index === 0 ? "rounded-t-lg" : ""} ${
                  index === results.length - 1 ? "rounded-b-lg" : "border-b border-neutral-200"
                }`}
              >
                {artist.images?.[0] && (
                  <img
                    src={artist.images[0].url || "/placeholder.svg"}
                    alt={artist.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-neutral-900 leading-tight">{artist.name}</div>
                  <div className="text-xs text-neutral-600 whitespace-nowrap leading-tight">
                    {compactNumber.format(artist.followers.total)} listeners
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
