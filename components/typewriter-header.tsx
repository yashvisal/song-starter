"use client"

import { useState, useEffect } from "react"
import TypewriterSlash from "@/components/TypewriterSlash"

const artists = [
  "Taylor Swift",
  "Drake",
  "Billie Eilish",
  "The Weeknd",
  "Ariana Grande",
  "Post Malone",
  "Dua Lipa",
  "Ed Sheeran",
  "Travis Scott",
  "Olivia Rodrigo",
]

export function TypewriterHeader() {
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentArtist = artists[currentArtistIndex]

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1))
          } else {
            setIsDeleting(false)
            setCurrentArtistIndex((prev) => (prev + 1) % artists.length)
          }
        } else {
          if (displayText.length < currentArtist.length) {
            setDisplayText(currentArtist.slice(0, displayText.length + 1))
          } else {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? 125 : isPaused ? 1750 : 125,
      // delete speed | pause speed | typing speed
    )

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, isPaused, currentArtistIndex])

  return (
    <h1 className="text-center text-4xl md:text-5xl font-semibold leading-tight tracking-tight mb-2">
      Helping you be the next{" "}
      <span className=" text-orange-500">
        {displayText}
        {/* <span className="animate-pulse inline-flex align-baseline -translate-y-[0.04em]">
          <TypewriterSlash />
        </span> */}
        {/* rotate-10 */}
        <span className="animate-pulse inline-block -translate-y-1">|</span>
      </span>
    </h1>
  )
}