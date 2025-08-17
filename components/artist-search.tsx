"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Sparkles, Loader2 } from "lucide-react"
import type { SpotifyArtist } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ArtistSearchProps {
  onArtistSelect?: (artist: SpotifyArtist) => void
}

export function ArtistSearch({ onArtistSelect }: ArtistSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SpotifyArtist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      router.push(`/artist/${artist.id}`)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="e.g., Taylor Swift, Drake, Billie Eilish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            className="pl-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          className="gap-2"
          disabled={!query.trim() || isLoading}
          onClick={() => (selectedIndex >= 0 ? handleArtistSelect(results[selectedIndex]) : null)}
        >
          <Sparkles className="w-4 h-4" />
          Analyze
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((artist, index) => (
              <button
                key={artist.id}
                onClick={() => handleArtistSelect(artist)}
                className={`w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? "bg-muted" : ""
                } ${index === 0 ? "rounded-t-lg" : ""} ${
                  index === results.length - 1 ? "rounded-b-lg" : "border-b border-border"
                }`}
              >
                {artist.images?.[0] && (
                  <img
                    src={artist.images[0].url || "/placeholder.svg"}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{artist.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {artist.genres.slice(0, 2).join(", ")} • {artist.followers.total.toLocaleString()} followers
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
