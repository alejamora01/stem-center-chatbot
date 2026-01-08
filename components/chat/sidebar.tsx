"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  PanelLeftClose,
  ExternalLink,
  Trash2,
  GraduationCap,
} from "lucide-react"

interface Conversation {
  id: string
  title: string
  timestamp: Date
  preview: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  conversations: Conversation[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export default function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  isDarkMode,
  onToggleDarkMode,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          flex flex-col w-64 bg-sidebar-bg
          border-r border-sidebar-border
          transition-all duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-0 lg:overflow-hidden"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4">
          <span className="font-semibold text-foreground">STEM Center</span>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-sidebar-hover transition-colors"
          >
            <PanelLeftClose className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 mb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-sidebar-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3">
          {conversations.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-foreground-muted">
                Recents
              </div>
              <div className="space-y-0.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${activeConversationId === conv.id
                        ? "bg-sidebar-active text-foreground"
                        : "text-foreground-muted hover:text-foreground hover:bg-sidebar-hover"
                      }
                    `}
                    onClick={() => onSelectConversation(conv.id)}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span className="text-sm truncate flex-1">{conv.title}</span>
                    {hoveredId === conv.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv.id)
                        }}
                        className="p-1 rounded hover:bg-sidebar-active text-foreground-muted hover:text-accent transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 space-y-0.5 border-t border-sidebar-border">
          <Link
            href="https://gannon.mywconline.com"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-sidebar-hover transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-sidebar-hover transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Gannon Student</div>
              <div className="text-xs text-foreground-muted">Free access</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
