import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
        <div>
          <div className="text-lg font-medium text-neutral-900">Analyzing Artist</div>
          <div className="text-sm text-neutral-600">Getting audio features and generating prompts...</div>
        </div>
      </div>
    </div>
  )
}


