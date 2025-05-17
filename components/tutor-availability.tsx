"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TutorAvailability } from "@/lib/excel-processor"

type TutorAvailabilityProps = {
  availabilityData: TutorAvailability[]
  sheetName: string
}

export default function TutorAvailabilityDisplay({ availabilityData, sheetName }: TutorAvailabilityProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  // Get unique tutor names
  const tutorNames =
    availabilityData.length > 0 ? [...new Set(availabilityData[0].tutors.map((tutor) => tutor.name))] : []

  // Filter time slots that have at least one available tutor
  const availableTimeSlots = availabilityData.filter((slot) => slot.tutors.some((tutor) => tutor.availability > 0))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#990000]">Tutor Availability - {sheetName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Time Slots</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {availableTimeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded cursor-pointer ${
                      selectedTimeSlot === slot.timeSlot ? "bg-[#990000] text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedTimeSlot(slot.timeSlot)}
                  >
                    {slot.timeSlot}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Available Tutors</h3>
              {selectedTimeSlot ? (
                <div className="space-y-2">
                  {availabilityData
                    .find((slot) => slot.timeSlot === selectedTimeSlot)
                    ?.tutors.filter((tutor) => tutor.availability > 0)
                    .map((tutor, index) => (
                      <div key={index} className="p-2 bg-gray-100 rounded flex justify-between">
                        <span>{tutor.name}</span>
                        <span className="font-medium">
                          {tutor.availability === 1 ? "Available" : `Availability: ${tutor.availability}`}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">Select a time slot to see available tutors</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#990000]">All Tutors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tutorNames.map((name, index) => (
              <div key={index} className="p-3 bg-gray-100 rounded">
                {name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
