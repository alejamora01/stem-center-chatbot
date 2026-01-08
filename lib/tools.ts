// LLM Tool definitions for the STEM Center Chatbot
// These tools allow the AI to query real-time data and provide accurate responses

import { tool } from "ai"
import { z } from "zod"
import { wconlineClient } from "./wconline"
import { stemCenterInfo } from "./stem-center-data"
import { cache } from "./cache"

/**
 * Tool: Get tutor availability for a specific date
 */
export const getTutorAvailability = tool({
  description:
    "Get available tutoring appointment slots for a specific date. Use this when a user asks about tutor availability, open slots, or wants to know when tutors are available on a particular day.",
  parameters: z.object({
    date: z
      .string()
      .describe("The date to check availability for (YYYY-MM-DD format)"),
    subject: z
      .string()
      .optional()
      .describe('Optional subject filter (e.g., "Calculus", "Physics", "Chemistry")'),
  }),
  execute: async ({ date, subject }) => {
    const cacheKey = `availability_${date}_${subject || "all"}`
    const cached = cache.get<object>(cacheKey)
    if (cached) {
      return cached
    }

    const response = await wconlineClient.getAvailableSlots(new Date(date))

    let slots = response.appointments
    if (subject) {
      slots = slots.filter(
        (slot) =>
          slot.tutorName.toLowerCase().includes(subject.toLowerCase()) ||
          slot.subject?.toLowerCase().includes(subject.toLowerCase())
      )
    }

    const availableSlots = slots.filter((s) => s.status === "available")

    const result = {
      date,
      subject: subject || "All subjects",
      availableSlots: availableSlots.slice(0, 10), // Limit to 10 slots
      totalAvailable: availableSlots.length,
      schedulingUrl: stemCenterInfo.appointmentUrl,
      note: response.error || null,
    }

    // Cache for 5 minutes
    cache.set(cacheKey, result, 5 * 60 * 1000)

    return result
  },
})

/**
 * Tool: Search for tutors by subject
 */
export const searchTutors = tool({
  description:
    'Search for tutors who can help with a specific subject or course. Use this when a user asks "who can help with X" or "tutors for Y" or "I need help with Z".',
  parameters: z.object({
    subject: z
      .string()
      .describe(
        'The subject or course to find tutors for (e.g., "Calculus II", "Organic Chemistry", "Python", "Physics")'
      ),
  }),
  execute: async ({ subject }) => {
    const cacheKey = `tutors_${subject.toLowerCase()}`
    const cached = cache.get<object>(cacheKey)
    if (cached) {
      return cached
    }

    const response = await wconlineClient.searchTutorsBySubject(subject)

    const result = {
      subject,
      tutors: response.tutors.map((t) => ({
        name: t.name,
        subjects: t.subjects,
        bio: t.bio,
      })),
      totalFound: response.tutors.length,
      schedulingUrl: stemCenterInfo.appointmentUrl,
      note: response.error || null,
    }

    // Cache for 10 minutes
    cache.set(cacheKey, result, 10 * 60 * 1000)

    return result
  },
})

/**
 * Tool: Get open appointment slots for upcoming days
 */
export const getOpenSlots = tool({
  description:
    "Get the next available open appointment slots for the coming days. Use this when a user asks about open appointments, available times, next available slot, or wants to book soon.",
  parameters: z.object({
    daysAhead: z
      .number()
      .min(1)
      .max(14)
      .default(7)
      .describe("Number of days ahead to search (default: 7, max: 14)"),
    tutorName: z
      .string()
      .optional()
      .describe("Optional specific tutor name to filter by"),
  }),
  execute: async ({ daysAhead = 7, tutorName }) => {
    const cacheKey = `openslots_${daysAhead}_${tutorName || "all"}`
    const cached = cache.get<object>(cacheKey)
    if (cached) {
      return cached
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    const response = await wconlineClient.getAvailableSlots(startDate, endDate)

    let availableSlots = response.appointments.filter(
      (s) => s.status === "available"
    )

    if (tutorName) {
      availableSlots = availableSlots.filter((s) =>
        s.tutorName.toLowerCase().includes(tutorName.toLowerCase())
      )
    }

    // Group by date for better readability
    const slotsByDate: Record<string, typeof availableSlots> = {}
    availableSlots.forEach((slot) => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = []
      }
      slotsByDate[slot.date].push(slot)
    })

    const result = {
      searchRange: {
        from: startDate.toISOString().split("T")[0],
        to: endDate.toISOString().split("T")[0],
      },
      tutorFilter: tutorName || "All tutors",
      slotsByDate,
      totalAvailable: availableSlots.length,
      schedulingUrl: stemCenterInfo.appointmentUrl,
      note: response.error || null,
    }

    // Cache for 3 minutes (availability changes frequently)
    cache.set(cacheKey, result, 3 * 60 * 1000)

    return result
  },
})

/**
 * Tool: Get STEM Center information
 */
export const getSTEMCenterInfo = tool({
  description:
    "Get general information about the STEM Center including location, hours, services, contact info, events, and resources. Use this for general questions about the center.",
  parameters: z.object({
    infoType: z
      .enum(["location", "hours", "services", "contact", "events", "resources", "programs", "all"])
      .describe("The type of information to retrieve"),
  }),
  execute: async ({ infoType }) => {
    const info: Record<string, unknown> = {}

    if (infoType === "location" || infoType === "all") {
      info.location = {
        building: stemCenterInfo.location,
        address: stemCenterInfo.address,
      }
    }

    if (infoType === "hours" || infoType === "all") {
      info.hours = {
        regular: stemCenterInfo.hours,
        specialNote: stemCenterInfo.specialHours?.note,
        currentWeek: stemCenterInfo.currentWeek,
      }
    }

    if (infoType === "services" || infoType === "all") {
      info.services = stemCenterInfo.services
    }

    if (infoType === "contact" || infoType === "all") {
      info.contact = {
        email: stemCenterInfo.email,
        director: stemCenterInfo.director,
        contacts: stemCenterInfo.contacts,
      }
    }

    if (infoType === "events" || infoType === "all") {
      info.events = stemCenterInfo.events
    }

    if (infoType === "resources" || infoType === "all") {
      info.resources = stemCenterInfo.resources
    }

    if (infoType === "programs" || infoType === "all") {
      info.programs = stemCenterInfo.programs
    }

    return info
  },
})

/**
 * Tool: Get scheduling instructions
 */
export const getSchedulingInstructions = tool({
  description:
    "Get step-by-step instructions on how to schedule a tutoring appointment. Use this when a user wants to know how to book an appointment or needs help with the scheduling process.",
  parameters: z.object({}),
  execute: async () => {
    return {
      instructions: stemCenterInfo.appointmentInstructions,
      schedulingUrl: stemCenterInfo.appointmentUrl,
      tips: [
        "We recommend 60-minute appointments for best results",
        "Use the 'Course or Focus' dropdown to find tutors for your specific course",
        "Email stemcenter@gannon.edu if you need help scheduling",
        "Some tutors are available at the Student Success Center in Palumbo - check the tutor name for (SSC in Palumbo)",
      ],
      contactEmail: stemCenterInfo.email,
    }
  },
})

// Export all tools as a collection for use in the chat API
export const chatTools = {
  getTutorAvailability,
  searchTutors,
  getOpenSlots,
  getSTEMCenterInfo,
  getSchedulingInstructions,
}
