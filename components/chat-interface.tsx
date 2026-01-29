"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, AlertCircle, RefreshCw, Square, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Suggested questions for the user
const suggestedQuestions = [
  "What are the STEM Center hours?",
  "Where is the STEM Center located?",
  "Who can help me with Calculus?",
  "What appointments are available?",
  "How do I schedule an appointment?",
]

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setInput,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm the STEM Center Assistant. I can help you find tutors, check availability, and answer questions about our services. What would you like to know?",
      },
    ],
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Submit after a brief delay to allow state update
    setTimeout(() => {
      const form = document.getElementById("chat-form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 50)
  }

  // Filter out tool-related messages for cleaner display
  const displayMessages = messages.filter(
    (message) => message.role === "user" || (message.role === "assistant" && message.content)
  )

  return (
    <div className="flex flex-col h-[600px] w-full rounded-2xl border bg-card shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">STEM Center Assistant</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            Online and ready to help
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`flex items-start gap-3 max-w-[85%] ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary text-secondary-foreground rounded-tl-sm"
                }`}
              >
                <div className="prose-chat text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stop}
                    className="h-6 px-2 text-xs"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex justify-center animate-fade-in">
            <div className="bg-error/10 text-error rounded-xl px-4 py-3 flex items-center gap-3 max-w-[90%]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Something went wrong</p>
                <p className="text-xs opacity-80">Please try again or refresh the page.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reload()}
                className="h-8 border-error text-error hover:bg-error hover:text-error-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions - only show at start */}
      {displayMessages.length <= 2 && (
        <div className="px-4 py-3 border-t bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="text-xs bg-card border border-border hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input form */}
      <form
        id="chat-form"
        onSubmit={handleSubmit}
        className="border-t p-4 bg-card"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about the STEM Center..."
              className="min-h-[48px] max-h-[120px] pr-12 resize-none"
              rows={1}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 rounded-xl shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
