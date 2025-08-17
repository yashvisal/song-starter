export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: {
    total: number
  }
  images: Array<{
    url: string
    height: number
    width: number
  }>
}

export interface AudioFeatures {
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  liveness: number
  loudness: number
  speechiness: number
  tempo: number
  valence: number
  key: number
  mode: number
  time_signature: number
}

export interface Artist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  imageUrl: string
  spotifyId: string
  audioFeatures: AudioFeatures
  createdAt: Date
  updatedAt: Date
}

export interface UserQuestion {
  id: string
  question: string
  answer: string
  type: "multiple_choice" | "text" | "scale"
  options?: string[]
}

export interface Generation {
  id: number
  artistId: string
  userQuestions: UserQuestion[]
  originalPrompts: string[]
  refinedPrompts: string[]
  generationMetadata: {
    analysisData: any
    timestamp: string
    processingTime: number
  }
  createdAt: Date
  artist?: Artist
}
