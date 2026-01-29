"use client"

import { useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp, Square } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = "Ask about tutoring, schedules, or resources...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [value])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-6">
      <div className="relative bg-input-bg rounded-3xl shadow-sm border border-input-border transition-all duration-200 focus-within:border-input-focus focus-within:shadow-md">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:opacity-50 max-h-[200px] py-4 pl-5 pr-14 leading-relaxed"
        />

        {/* Send/Stop button */}
        <div className="absolute right-3 bottom-3">
          {isLoading ? (
            <button
              onClick={onStop}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground-muted text-background hover:bg-foreground transition-colors"
              aria-label="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!hasContent}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                hasContent
                  ? "bg-foreground text-background hover:opacity-80"
                  : "bg-input-border text-foreground-muted cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Footer text */}
      <p className="text-center text-xs text-foreground-muted/70 mt-3">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
