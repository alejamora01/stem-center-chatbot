import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import TutorsList from "@/components/tutors-list"
import { stemCenterInfo } from "@/lib/stem-center-data"

export default function Tutors() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Users className="h-6 w-6 text-[#990000]" />
            <h1 className="text-lg font-semibold text-[#990000]">STEM Center - Tutors</h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chatbot
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 text-[#990000]">STEM Center Tutors</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find and schedule appointments with our qualified tutors
            </p>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">
              Several of our tutors are now available in the Student Success Center (SSC) in Palumbo; please note their
              differing location by their names!
            </p>
          </div>

          <TutorsList />

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              For a complete and up-to-date schedule, or to make an appointment, please visit our official scheduling
              system:
            </p>
            <a
              href={stemCenterInfo.appointmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#990000] px-6 py-3 text-base font-medium text-white hover:bg-[#7a0000] focus:outline-none focus:ring-2 focus:ring-[#990000] focus:ring-offset-2"
            >
              Schedule an Appointment
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 px-4 sm:px-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Gannon University STEM Center</p>
          <p className="text-sm text-gray-500">For assistance, email: {stemCenterInfo.email}</p>
        </div>
      </footer>
    </div>
  )
}
