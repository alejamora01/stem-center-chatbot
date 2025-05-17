import Link from "next/link"
import ChatInterface from "@/components/chat-interface"
import { GannonLogo } from "@/components/gannon-logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <GannonLogo />
          <h1 className="text-lg font-semibold">Gannon University STEM Center Assistant</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/yourusername/stem-center-chatbot"
            target="_blank"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            GitHub
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-between p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto flex flex-col flex-1">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 text-[#990000]">
              STEM Center AI Assistant
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your virtual assistant for information about the STEM Center, tutoring, resources, and more.
            </p>
          </div>

          <div className="flex-1 w-full">
            <ChatInterface />
          </div>
        </div>
      </main>

      <footer className="border-t py-4 px-4 sm:px-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} STEM Center Assistant. Project in development.
          </p>
          <p className="text-sm text-gray-500">Developed with Next.js and AI SDK</p>
        </div>
      </footer>
    </div>
  )
}
