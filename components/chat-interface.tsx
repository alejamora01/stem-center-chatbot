"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

// Types for messages
type Message = {
  role: "user" | "assistant"
  content: string
}

// Suggested questions for the user
const suggestedQuestions = [
  "What are the STEM Center hours?",
  "Where is the STEM Center located?",
  "What tutoring services are available?",
  "Who can help me with Calculus?",
  "What events are coming up?",
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the virtual assistant for the Gannon University STEM Center. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = { role: "assistant", content: data.response }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || "Error processing your request")
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, there was an error processing your request. Please try again later."
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] w-full border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-start gap-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-[#990000] text-white rounded-l-lg rounded-tr-lg"
                  : "bg-gray-100 text-gray-800 rounded-r-lg rounded-tl-lg"
              } p-3`}
            >
              <div className="mt-1">
                {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className="whitespace-pre-line">{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-r-lg rounded-tl-lg p-3 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              className="text-xs bg-white border border-[#990000] hover:bg-[#fff8e8] text-[#990000] px-3 py-1 rounded-full transition-colors"
              onClick={() => {
                setInput(question)
                setTimeout(() => {
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                }, 100)
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          className="flex-1 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}
