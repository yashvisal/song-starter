"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GenerationCard } from "./generation-card"
import { Search, Loader2, RefreshCw } from "lucide-react"
import type { Generation } from "@/lib/types"

export function GalleryView() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [username, setUsername] = useState<string>("")

  const fetchGenerations = async (search = "") => {
    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("limit", "20")
      if (mineOnly && username) params.set("user", username)

      const response = await fetch(`/api/generations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGenerations(data)
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
    fetchGenerations()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchGenerations(searchQuery)
    }, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, mineOnly, username])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchGenerations(searchQuery)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Browse Generations</span>
            <div className="flex items-center gap-3">
              <label className="text-xs flex items-center gap-1 select-none">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                />
                {username ? `Only mine (${username})` : "Only mine"}
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Discover AI music prompts created by the community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by artist name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading generations...</p>
          </div>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {generations.length} generation{generations.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          <div className="grid gap-6">
            {generations.map((generation) => (
              <GenerationCard key={generation.id} generation={generation} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
