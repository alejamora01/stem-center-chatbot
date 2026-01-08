"use client"

import { Sparkles } from "lucide-react"

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

const quickActions = [
  { label: "Tutoring", query: "What tutoring services are available?" },
  { label: "Hours", query: "What are the STEM Center hours?" },
  { label: "Subjects", query: "What subjects can I get help with?" },
  { label: "Location", query: "Where is the STEM Center located?" },
]

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fadeIn">
      {/* Main greeting */}
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-8 h-8 text-accent" />
        <h1 className="text-4xl sm:text-5xl font-medium text-foreground tracking-tight">
          How can I help?
        </h1>
      </div>

      {/* Quick action pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onSuggestionClick(action.query)}
            className="px-4 py-2 rounded-full text-sm border border-input-border text-foreground-muted hover:text-foreground hover:border-foreground-muted hover:bg-sidebar-hover transition-all duration-200"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
