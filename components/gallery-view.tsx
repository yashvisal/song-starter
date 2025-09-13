"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, RefreshCw } from "lucide-react"
import type { Generation } from "@/lib/types"
import { GalleryCard } from "./gallery-card"
import { GalleryModal } from "./gallery-modal"

interface GalleryViewProps {
  limit?: number
  showSearch?: boolean
  showMineOnly?: boolean
  compact?: boolean
}

export function GalleryView({ limit = 15, showSearch = true, showMineOnly = true, compact = false }: GalleryViewProps) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [active, setActive] = useState<Generation | null>(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState<number | null>(null)

  const fetchGenerations = async (search = "", newOffset = 0) => {
    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", String(limit))
      params.set("offset", String(newOffset))
      if (showMineOnly && mineOnly && username) params.set("user", username)

      const response = await fetch(`/api/generations?${params}`)
      if (response.ok) {
        const data = await response.json()
        const totalHeader = response.headers.get("x-total-count")
        setTotal(totalHeader ? Number(totalHeader) : null)
        setGenerations(data)
        setOffset(newOffset)
      }
    } catch (error) {
      console.error("Failed to fetch generations:", error)
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    try {
      const u = localStorage.getItem("suno_username") || ""
      setUsername(u)
    } catch {}
    fetchGenerations("", 0)
  }, [limit])

  useEffect(() => {
    const onNameChanged = (e: any) => {
      const next = e?.detail?.username || ""
      setUsername(next)
      fetchGenerations(searchQuery, 0)
    }
    window.addEventListener("suno:usernameChanged", onNameChanged as any)
    return () => window.removeEventListener("suno:usernameChanged", onNameChanged as any)
  }, [searchQuery])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchGenerations(searchQuery, 0)
    }, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, mineOnly, username, limit])

  const handlePageChange = (direction: "prev" | "next") => {
    const newOffset = Math.max(0, offset + (direction === "next" ? limit : -limit))
    fetchGenerations(searchQuery, newOffset)
  }

  // Pagination-based navigation; infinite scroll removed per feedback

  return (
    <div className="space-y-6">
      {showSearch && (
        <div className="pt-0">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search by artist name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-10 rounded-2xl border-neutral-200 shadow-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-500" />
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: compact ? 6 : 9 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl border border-neutral-200 bg-neutral-50 animate-pulse" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {searchQuery ? (
                <div>
                  <p className="text-lg mb-2">No generations found for "{searchQuery}"</p>
                  <p className="text-sm">Try searching for a different artist or clear your search</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">No generations yet</p>
                  <p className="text-sm">Be the first to create some AI music prompts!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {!compact && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {typeof total === "number"
                  ? `Showing ${Math.min(total, offset + 1)}–${Math.min(total, offset + generations.length)} of ${total} generations`
                  : `${generations.length} generations`}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={offset === 0}
                  onClick={() => handlePageChange("prev")}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={typeof total === "number" ? offset + generations.length >= total : generations.length < limit}
                  onClick={() => handlePageChange("next")}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((g) => (
              <GalleryCard key={g.id} generation={g} onSelect={setActive} />
            ))}
          </div>
          {!compact && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                {typeof total === "number"
                  ? `Showing ${Math.min(total, offset + 1)}–${Math.min(total, offset + generations.length)} of ${total}`
                  : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={offset === 0}
                  onClick={() => handlePageChange("prev")}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={typeof total === "number" ? offset + generations.length >= total : generations.length < limit}
                  onClick={() => handlePageChange("next")}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <GalleryModal open={!!active} onClose={() => setActive(null)} generation={active} />
    </div>
  )
}
