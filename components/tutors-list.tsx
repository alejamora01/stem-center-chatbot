"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stemCenterInfo } from "@/lib/stem-center-data"

// Type for tutors
type Tutor = {
  name: string
  subjects: string[]
  schedule: string
}

export default function TutorsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)

  const tutors = stemCenterInfo.tutors

  // Extract all unique subjects from tutors
  const allSubjects = Array.from(new Set(tutors.flatMap((tutor) => tutor.subjects))).sort()

  // Filter tutors based on search and subject filter
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      searchTerm === "" ||
      tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutor.subjects.some((subject) => subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tutor.schedule.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSubject = subjectFilter === null || tutor.subjects.includes(subjectFilter)

    return matchesSearch && matchesSubject
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tutors by name, subject, or schedule..."
            className="w-full rounded-md border border-input pl-10 pr-4 py-2 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-shrink-0">
          <select
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
            value={subjectFilter || ""}
            onChange={(e) => setSubjectFilter(e.target.value || null)}
          >
            <option value="">All Subjects</option>
            {allSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTutors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tutors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTutors.map((tutor, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {tutor.name}
                  {tutor.name.includes("SSC") && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      SSC in Palumbo
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subjects:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tutor.subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Schedule:</p>
                    <p className="text-sm">{tutor.schedule}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <a
                    href={stemCenterInfo.appointmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-[#990000] hover:underline"
                  >
                    Schedule an appointment
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
