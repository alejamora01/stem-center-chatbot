"use client"

import { Copy, Check, RefreshCw, Sparkles, User } from "lucide-react"
import { useState } from "react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  isLoading?: boolean
  onRegenerate?: () => void
}

export default function ChatMessage({
  role,
  content,
  isLoading,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === "user"

  return (
    <div
      className="w-full py-5 animate-fadeInSoft"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div
            className={`
              flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
              ${isUser ? "bg-primary/20" : "bg-accent/20"}
            `}
          >
            {isUser ? (
              <User className="w-4 h-4 text-primary" />
            ) : (
              <Sparkles className="w-4 h-4 text-accent" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="text-sm font-medium text-foreground-muted">
              {isUser ? "You" : "STEM Assistant"}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-1.5 py-2">
                <div className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              <>
                <div className="chat-content text-[15px] text-foreground leading-relaxed">
                  {content}
                </div>

                {/* Actions - show on hover for assistant messages */}
                {!isUser && content && (
                  <div
                    className={`flex items-center gap-1 mt-2 transition-opacity duration-150 ${
                      showActions ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-sidebar-hover rounded-md transition-colors"
                      aria-label={copied ? "Copied" : "Copy"}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-sidebar-hover rounded-md transition-colors"
                        aria-label="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
