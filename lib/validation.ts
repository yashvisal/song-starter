import type { AnalysisResult } from "./llm"
import type { UserQuestion } from "./types"
export interface SearchArtistsQuery {
  q: string
}

export interface AnalyzeArtistRequest {
  artistId: string
}

export interface RefinePromptsRequest {
  artistId: string
  originalAnalysis: AnalysisResult
  userAnswers: UserQuestion[]
}

export interface GenerationsQuery {
  search?: string
  limit?: string
  offset?: string
}

// Validation functions
export function validateSearchQuery(query: unknown): SearchArtistsQuery {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    throw new Error("Search query is required and must be a non-empty string")
  }

  if (query.length > 100) {
    throw new Error("Search query must be less than 100 characters")
  }

  return { q: query.trim() }
}

export function validateAnalyzeRequest(data: unknown): AnalyzeArtistRequest {
  if (!data || typeof data !== "object" || !data) {
    throw new Error("Request body is required")
  }

  const { artistId } = data as any

  if (!artistId || typeof artistId !== "string") {
    throw new Error("artistId is required and must be a string")
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(artistId)) {
    throw new Error("artistId contains invalid characters")
  }

  return { artistId }
}

export function validateRefineRequest(data: unknown): RefinePromptsRequest {
  if (!data || typeof data !== "object") {
    throw new Error("Request body is required")
  }

  const { artistId, originalAnalysis, userAnswers } = data as any

  if (!artistId || typeof artistId !== "string") {
    throw new Error("artistId is required and must be a string")
  }

  if (!originalAnalysis || typeof originalAnalysis !== "object") {
    throw new Error("originalAnalysis is required")
  }

  if (!Array.isArray(userAnswers)) {
    throw new Error("userAnswers must be an array")
  }

  return { artistId, originalAnalysis, userAnswers }
}

export function validateGenerationsQuery(searchParams: URLSearchParams): GenerationsQuery {
  const search = searchParams.get("search")
  const limit = searchParams.get("limit")
  const offset = searchParams.get("offset")

  // Validate limit
  if (limit) {
    const limitNum = Number.parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error("limit must be a number between 1 and 100")
    }
  }

  // Validate offset
  if (offset) {
    const offsetNum = Number.parseInt(offset)
    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new Error("offset must be a non-negative number")
    }
  }

  // Validate search
  if (search && search.length > 100) {
    throw new Error("search query must be less than 100 characters")
  }

  return { search: search ?? undefined, limit: limit ?? undefined, offset: offset ?? undefined }
}
