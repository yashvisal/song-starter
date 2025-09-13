"use client"

import * as React from "react"

export default function TypewriterSlash() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center align-baseline select-none mx-[0.15ch]"
    >
      <svg
        width="0.6em"
        height="0.9em"
        viewBox="0 0 60 100"
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <line
          x1="6"
          y1="94"
          x2="54"
          y2="6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  )
}


