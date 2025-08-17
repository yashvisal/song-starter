import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { Artist, UserQuestion } from "./types"

export interface AnalysisResult {
  musicalAnalysis: string
  styleDescription: string
  keyCharacteristics: string[]
  suggestedMoods: string[]
  questions: UserQuestion[]
  initialPrompts: string[]
}

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks and trim whitespace
  return text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim()
}

function createFallbackAnalysis(artist: Artist): AnalysisResult {
  const genres = artist.genres.length > 0 ? artist.genres : ["pop"]
  const primaryGenre = genres[0]

  return {
    musicalAnalysis: `${artist.name} represents a ${primaryGenre} artist with distinctive musical characteristics. Their sound combines modern production techniques with ${artist.audioFeatures.energy > 0.6 ? "high-energy" : "mellow"} elements.`,
    styleDescription: `${primaryGenre.charAt(0).toUpperCase() + primaryGenre.slice(1)} artist with ${artist.audioFeatures.danceability > 0.6 ? "danceable" : "atmospheric"} qualities.`,
    keyCharacteristics: [
      `${Math.round(artist.audioFeatures.tempo)} BPM tempo`,
      `${artist.audioFeatures.energy > 0.6 ? "High energy" : "Moderate energy"} production`,
      `${artist.audioFeatures.valence > 0.5 ? "Uplifting" : "Introspective"} mood`,
      `${artist.audioFeatures.acousticness > 0.5 ? "Acoustic elements" : "Electronic production"}`,
      `${primaryGenre} influences`,
    ],
    suggestedMoods:
      artist.audioFeatures.valence > 0.5
        ? ["upbeat", "energetic", "positive", "vibrant", "dynamic"]
        : ["introspective", "atmospheric", "emotional", "contemplative", "moody"],
    questions: [
      {
        id: "q_1",
        question: "What mood are you looking for in your music?",
        type: "multiple_choice",
        options: ["Upbeat & Energetic", "Chill & Relaxed", "Emotional & Deep", "Party & Dance"],
      },
      {
        id: "q_2",
        question: "What tempo preference do you have?",
        type: "multiple_choice",
        options: ["Fast (120+ BPM)", "Medium (90-120 BPM)", "Slow (60-90 BPM)", "Variable"],
      },
      {
        id: "q_3",
        question: "Any specific instruments you want featured?",
        type: "text",
        options: [],
      },
      {
        id: "q_4",
        question: "How experimental should the sound be?",
        type: "scale",
        options: [],
      },
      {
        id: "q_5",
        question: "What setting or vibe are you imagining?",
        type: "text",
        options: [],
      },
    ],
    initialPrompts: [
      `Create a ${primaryGenre} track inspired by ${artist.name} with ${Math.round(artist.audioFeatures.tempo)} BPM tempo and ${artist.audioFeatures.energy > 0.6 ? "high energy" : "mellow"} vibes.`,
      `${primaryGenre} song with ${artist.audioFeatures.valence > 0.5 ? "uplifting" : "introspective"} mood, featuring modern production techniques.`,
      `${artist.audioFeatures.danceability > 0.6 ? "Danceable" : "Atmospheric"} ${primaryGenre} track with ${artist.audioFeatures.acousticness > 0.5 ? "acoustic elements" : "electronic production"}.`,
      `${primaryGenre} composition at ${Math.round(artist.audioFeatures.tempo)} BPM with ${artist.audioFeatures.mode === 1 ? "major" : "minor"} key progression.`,
      `Modern ${primaryGenre} track with ${artist.audioFeatures.speechiness > 0.3 ? "vocal emphasis" : "instrumental focus"} and dynamic arrangement.`,
      `${artist.audioFeatures.energy > 0.7 ? "High-energy" : "Smooth"} ${primaryGenre} song with contemporary production style.`,
      `${primaryGenre} track featuring ${artist.audioFeatures.liveness > 0.3 ? "live performance energy" : "studio polish"} and rich harmonies.`,
      `${artist.audioFeatures.valence > 0.6 ? "Feel-good" : "Emotional"} ${primaryGenre} composition with layered instrumentation.`,
      `${primaryGenre} song with ${artist.audioFeatures.instrumentalness > 0.5 ? "instrumental focus" : "vocal-driven"} arrangement at ${Math.round(artist.audioFeatures.tempo)} BPM.`,
      `Contemporary ${primaryGenre} track blending ${artist.audioFeatures.acousticness > 0.5 ? "organic" : "electronic"} elements with modern production.`,
    ],
  }
}

export async function analyzeArtistAndGeneratePrompts(artist: Artist): Promise<AnalysisResult> {
  const analysisPrompt = `
You are a music production expert analyzing the artist "${artist.name}" to create AI music prompts for Suno AI.

Artist Data:
- Genres: ${artist.genres.join(", ")}
- Popularity: ${artist.popularity}/100
- Audio Features:
  - Energy: ${(artist.audioFeatures.energy * 100).toFixed(1)}%
  - Danceability: ${(artist.audioFeatures.danceability * 100).toFixed(1)}%
  - Valence (positivity): ${(artist.audioFeatures.valence * 100).toFixed(1)}%
  - Acousticness: ${(artist.audioFeatures.acousticness * 100).toFixed(1)}%
  - Instrumentalness: ${(artist.audioFeatures.instrumentalness * 100).toFixed(1)}%
  - Speechiness: ${(artist.audioFeatures.speechiness * 100).toFixed(1)}%
  - Tempo: ${Math.round(artist.audioFeatures.tempo)} BPM
  - Key: ${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][artist.audioFeatures.key]}
  - Mode: ${artist.audioFeatures.mode === 1 ? "Major" : "Minor"}

Please provide a JSON response with:
1. musicalAnalysis: A detailed analysis of their musical style (2-3 sentences)
2. styleDescription: A concise style summary (1 sentence)
3. keyCharacteristics: Array of 4-5 key musical characteristics
4. suggestedMoods: Array of 4-5 mood/emotion words that fit their style
5. questions: Array of 5 personalization questions to ask the user (each with id, question, type, and options if multiple_choice)
6. initialPrompts: Array of 10 diverse Suno AI prompts inspired by this artist's style

For the prompts, make them varied and creative while staying true to the artist's style. Include genre, mood, tempo, and specific musical elements. Each prompt should be 1-2 sentences and ready to use in Suno AI.

Return only valid JSON without markdown code blocks.
`

  try {
    console.log("[v0] Starting LLM analysis for artist:", artist.name)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: analysisPrompt,
      temperature: 0.8,
    })

    console.log("[v0] Raw LLM response length:", text.length)

    const cleanedText = cleanJsonResponse(text)
    console.log("[v0] Cleaned response preview:", cleanedText.substring(0, 100))

    const result = JSON.parse(cleanedText) as AnalysisResult

    // Ensure questions have proper IDs
    result.questions = result.questions.map((q, index) => ({
      ...q,
      id: `q_${index + 1}`,
    }))

    console.log("[v0] Successfully parsed LLM analysis")
    return result
  } catch (error) {
    console.error("[v0] LLM analysis failed:", error)
    console.log("[v0] Using fallback analysis for artist:", artist.name)

    return createFallbackAnalysis(artist)
  }
}

export async function refinePromptsWithUserFeedback(
  artist: Artist,
  originalAnalysis: AnalysisResult,
  userAnswers: UserQuestion[],
): Promise<string[]> {
  const refinementPrompt = `
You are refining AI music prompts based on user feedback for the artist "${artist.name}".

Original Analysis:
- Style: ${originalAnalysis.styleDescription}
- Key Characteristics: ${originalAnalysis.keyCharacteristics.join(", ")}
- Suggested Moods: ${originalAnalysis.suggestedMoods.join(", ")}

Original 10 Prompts:
${originalAnalysis.initialPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

User Personalization Answers:
${userAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}

Based on the user's answers, create 10 NEW refined prompts that:
1. Incorporate the user's preferences and feedback
2. Stay true to ${artist.name}'s musical style
3. Are more personalized and targeted
4. Are ready to use in Suno AI (1-2 sentences each)
5. Show variety while respecting user preferences

Return ONLY a JSON array of 10 string prompts, no markdown code blocks.
`

  try {
    console.log("[v0] Starting prompt refinement for artist:", artist.name)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: refinementPrompt,
      temperature: 0.7,
    })

    const cleanedText = cleanJsonResponse(text)
    console.log("[v0] Cleaned refinement response preview:", cleanedText.substring(0, 100))

    const refinedPrompts = JSON.parse(cleanedText) as string[]
    console.log("[v0] Successfully refined prompts, count:", refinedPrompts.length)

    return refinedPrompts
  } catch (error) {
    console.error("[v0] Prompt refinement failed:", error)
    console.log("[v0] Using modified original prompts as fallback")

    return originalAnalysis.initialPrompts.map((prompt, index) => `${prompt} (Personalized variation ${index + 1})`)
  }
}
