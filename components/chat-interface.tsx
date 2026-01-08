"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, AlertCircle, RefreshCw, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

// Suggested questions for the user
const suggestedQuestions = [
  "What are the STEM Center hours?",
  "Where is the STEM Center located?",
  "Who can help me with Calculus?",
  "What appointments are available this week?",
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
          "Hello! I'm the virtual assistant for the Gannon University STEM Center. I can help you find tutors, check availability, and answer questions about our services. How can I help you today?",
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
    <Card className="flex flex-col h-[600px] w-full border rounded-lg overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-start gap-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-[#990000] text-white rounded-l-lg rounded-tr-lg"
                  : "bg-gray-100 text-gray-800 rounded-r-lg rounded-tl-lg"
              } p-3`}
            >
              <div className="mt-1 flex-shrink-0">
                {message.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div className="whitespace-pre-line prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-r-lg rounded-tl-lg p-3 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={stop}
                className="ml-2 h-6 px-2 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 text-red-800 rounded-lg p-3 flex items-center gap-2 max-w-[80%]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">
                  Sorry, something went wrong. Please try again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reload()}
                className="ml-2 h-6 px-2 text-xs"
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
        <div className="px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="text-xs bg-white border border-[#990000] hover:bg-[#fff8e8] text-[#990000] px-3 py-1 rounded-full transition-colors disabled:opacity-50"
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
      <form id="chat-form" onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type your question here..."
          className="flex-1 resize-none"
          rows={1}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !input.trim()} aria-label="Send message">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  )
}
