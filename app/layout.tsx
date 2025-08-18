import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Suno Producer - AI Music Prompt Generator",
  description: "Analyze Spotify artists and generate personalized AI music prompts",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border bg-card">
            <div className="container mx-auto px-4 py-6 text-sm flex items-center justify-between">
              <p className="text-muted-foreground">
                Analysis powered by{' '}
                <a href="https://getsongbpm.com" className="underline hover:text-foreground">
                  GetSongBPM
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
