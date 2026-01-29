import { Code, Database, Rocket, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GannonLogo } from "@/components/gannon-logo"

export default function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <GannonLogo />
            <h1 className="text-lg font-semibold">STEM Center Assistant - About</h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Chatbot
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 text-[#990000]">
              About the STEM Center Assistant
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A project to improve the student experience at the STEM Center
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-[#990000]" />
                  Project Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The STEM Center Assistant is a chatbot designed to provide quick and accurate information about the
                  services, resources, and events at the STEM Center. Our goal is to improve the student experience by
                  facilitating access to information and reducing the workload of the center&apos;s staff.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-[#990000]" />
                  Technologies Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      1
                    </div>
                    <span>
                      <strong>Next.js:</strong> React framework for web development
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      2
                    </div>
                    <span>
                      <strong>Tailwind CSS:</strong> CSS framework for rapid and responsive design
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      3
                    </div>
                    <span>
                      <strong>AI SDK:</strong> Development kit for integration with AI models
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      4
                    </div>
                    <span>
                      <strong>TypeScript:</strong> JavaScript superset with static typing
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#990000]" />
                  Information Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The assistant uses various information sources to provide accurate answers:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      •
                    </div>
                    <span>Internal database with STEM Center information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      •
                    </div>
                    <span>Calendar of events and activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      •
                    </div>
                    <span>Directory of tutors and availability schedules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-[#990000] text-white text-xs font-bold">
                      •
                    </div>
                    <span>Documentation on available services and resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#990000]" />
                  Development Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  This project is being developed by the Tech Evangelists team at the STEM Center, with the goal of
                  improving the student experience and promoting the use of modern technologies.
                </p>
                <div className="flex justify-center mt-4">
                  <Link href="/roadmap">
                    <Button className="gap-2">View Development Plan</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 px-4 sm:px-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} STEM Center Assistant. Project in development.
          </p>
          <Link href="/" className="text-sm text-[#990000] hover:underline">
            Back to Chatbot
          </Link>
        </div>
      </footer>
    </div>
  )
}
