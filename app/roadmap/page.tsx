import { ArrowRight, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GannonLogo } from "@/components/gannon-logo"

export default function Roadmap() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <GannonLogo />
            <h1 className="text-lg font-semibold">STEM Center Assistant - Roadmap</h1>
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
              STEM Center Assistant Development Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Timeline and implementation phases of the virtual assistant for the STEM Center
            </p>
          </div>

          <div className="space-y-8">
            {/* Phase 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <CardTitle>Phase 1: Basic Prototype (Completed)</CardTitle>
                </div>
                <CardDescription>Initial implementation of the chatbot with basic functionalities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Basic chat interface</strong> - Implementation of the user interface for the chatbot
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Rule-based responses</strong> - Simple response system based on keywords
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Basic STEM Center information</strong> - Data about location, hours, and services
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <CardTitle>Phase 2: AI Integration (In Progress)</CardTitle>
                </div>
                <CardDescription>Enhancement of the chatbot with advanced AI capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>OpenAI Integration</strong> - Implementation of the OpenAI API for more natural responses
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Expanded knowledge base</strong> - Expanding the available information about the STEM
                      Center
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Conversation memory</strong> - Ability to remember the context of the conversation
                    </span>
                  </li>
                </ul>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Estimated completion date:</strong> 2 weeks
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Phase 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <CardTitle>Phase 3: Advanced Features (Planned)</CardTitle>
                </div>
                <CardDescription>Expansion of capabilities and functionalities of the assistant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>User authentication</strong> - Allow students to log in to receive personalized
                      information
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tutoring reservations</strong> - Integration with the reservation system to schedule
                      sessions with tutors
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Event notifications</strong> - Alerts about upcoming events and activities
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>3D printing integration</strong> - Check status of print jobs and submit models
                    </span>
                  </li>
                </ul>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Estimated start date:</strong> 1 month
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Phase 4 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <CardTitle>Phase 4: Full Deployment (Planned)</CardTitle>
                </div>
                <CardDescription>Final implementation and launch of the assistant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Integration with STEM Center displays</strong> - Deployment of the chatbot on interactive
                      screens
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mobile application</strong> - Version for mobile devices
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Usage analytics</strong> - Implementation of metrics to evaluate usage and effectiveness
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Continuous training</strong> - System to constantly improve the chatbot&apos;s responses
                    </span>
                  </li>
                </ul>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Estimated start date:</strong> 3 months
                  </p>
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
