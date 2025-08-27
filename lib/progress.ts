export type AnalysisPhase = "idle" | "fetching" | "analyzing" | "averaging" | "done" | "error"

export interface ArtistProgress {
  phase: AnalysisPhase
  position: number
  total: number
  currentTrackName?: string
  updatedAt: number
  message?: string
}

const progressByArtist = new Map<string, ArtistProgress>()

export function setArtistProgress(artistId: string, progress: Partial<ArtistProgress>) {
  const prev = progressByArtist.get(artistId) || { phase: "idle", position: 0, total: 0, updatedAt: Date.now() }
  const next: ArtistProgress = {
    ...prev,
    ...progress,
    updatedAt: Date.now(),
  }
  progressByArtist.set(artistId, next)
}

export function getArtistProgress(artistId: string): ArtistProgress | undefined {
  return progressByArtist.get(artistId)
}


