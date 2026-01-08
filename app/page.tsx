"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "ai/react"
import { Sidebar, ChatMessage, ChatInput, WelcomeScreen } from "@/components/chat"
import { PanelLeft } from "lucide-react"

interface Conversation {
  id: string
  title: string
  timestamp: Date
  preview: string
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Update conversation title from first user message
      if (messages.length === 1 && activeConversationId) {
        const userMessage = messages[0]
        if (userMessage?.role === "user") {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? { ...c, title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : "") }
                : c
            )
          )
        }
      }
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize dark mode from system preference
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newValue
    })
  }, [])

  // Handle new chat
  const handleNewChat = useCallback(() => {
    const newId = crypto.randomUUID()
    const newConversation: Conversation = {
      id: newId,
      title: "New conversation",
      timestamp: new Date(),
      preview: "",
    }
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newId)
    setMessages([])
    setInput("")
  }, [setMessages, setInput])

  // Handle conversation selection
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    // In a real app, you'd load the conversation messages here
    setMessages([])
  }, [setMessages])

  // Handle conversation deletion
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversationId === id) {
      setActiveConversationId(undefined)
      setMessages([])
    }
  }, [activeConversationId, setMessages])

  // Handle form submit
  const handleFormSubmit = useCallback(() => {
    if (!input.trim()) return

    // Create conversation if none exists
    if (!activeConversationId) {
      const newId = crypto.randomUUID()
      const newConversation: Conversation = {
        id: newId,
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        timestamp: new Date(),
        preview: input,
      }
      setConversations((prev) => [newConversation, ...prev])
      setActiveConversationId(newId)
    }

    handleSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>)
  }, [input, activeConversationId, handleSubmit])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
    // Small delay to ensure state is updated
    setTimeout(() => {
      handleFormSubmit()
    }, 50)
  }, [setInput, handleFormSubmit])

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className={`flex items-center h-14 px-4 border-b border-sidebar-border ${sidebarOpen ? 'lg:hidden' : ''}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-sidebar-hover transition-colors"
            aria-label="Open sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-semibold text-sm">STEM Assistant</h1>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {hasMessages ? (
            <div className="min-h-full">
              {messages
                .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
                .map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role as "user" | "assistant"}
                    content={message.content}
                    onRegenerate={
                      message.role === "assistant" && index === messages.length - 1
                        ? () => reload()
                        : undefined
                    }
                  />
                ))}
              {isLoading && (
                <ChatMessage
                  role="assistant"
                  content=""
                  isLoading={true}
                />
              )}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          ) : (
            <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleFormSubmit}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}
