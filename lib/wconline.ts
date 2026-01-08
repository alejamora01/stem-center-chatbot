// WCOnline API Client for Gannon University STEM Center
// Handles authentication and data fetching from WCOnline scheduling system

import crypto from "crypto"
import { stemCenterInfo } from "./stem-center-data"

// Types for WCOnline API responses
export interface WCOnlineAppointment {
  id: string
  tutorId: string
  tutorName: string
  date: string
  startTime: string
  endTime: string
  subject?: string
  location?: string
  status: "available" | "booked" | "unavailable"
}

export interface WCOnlineTutor {
  id: string
  name: string
  subjects: string[]
  bio?: string
}

export interface WCOnlineScheduleResponse {
  success: boolean
  appointments: WCOnlineAppointment[]
  error?: string
}

export interface WCOnlineTutorsResponse {
  success: boolean
  tutors: WCOnlineTutor[]
  error?: string
}

// Configuration
const WCONLINE_BASE_URL = "https://gannon.mywconline.net"

/**
 * Generate MD5 authentication hash for WCOnline API
 * Hash = MD5(API_KEY + YYYYMMDD + IP_ADDRESS)
 * Note: WCOnline uses UTC-5 (Eastern Standard Time) for date calculation
 */
function generateAuthHash(apiKey: string, ipAddress: string): string {
  // Get current date in UTC-5 (Eastern Standard Time)
  const now = new Date()
  // UTC-5 offset in milliseconds
  const utc5Offset = -5 * 60 * 60 * 1000
  const localOffset = now.getTimezoneOffset() * 60 * 1000
  const utc5Time = new Date(now.getTime() + localOffset + utc5Offset)

  // Format as YYYYMMDD
  const year = utc5Time.getFullYear()
  const month = String(utc5Time.getMonth() + 1).padStart(2, "0")
  const day = String(utc5Time.getDate()).padStart(2, "0")
  const dateString = `${year}${month}${day}`

  // Create MD5 hash
  const hashInput = `${apiKey}${dateString}${ipAddress}`
  return crypto.createHash("md5").update(hashInput).digest("hex")
}

/**
 * Format date as YYYYMMDD for API requests
 */
function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}${month}${day}`
}

/**
 * WCOnline API Client class
 */
export class WCOnlineClient {
  private apiKey: string
  private scheduleId: string
  private serverIp: string
  private isConfigured: boolean

  constructor() {
    this.apiKey = process.env.WCONLINE_API_KEY || ""
    this.scheduleId = process.env.WCONLINE_SCHEDULE_ID || ""
    this.serverIp = process.env.SERVER_IP || ""
    this.isConfigured = !!(this.apiKey && this.scheduleId && this.serverIp)

    if (!this.isConfigured) {
      console.warn(
        "WCOnline API not fully configured. Using fallback static data."
      )
    }
  }

  /**
   * Check if the client is properly configured
   */
  isReady(): boolean {
    return this.isConfigured
  }

  /**
   * Get authentication key for API requests
   */
  private getAuthKey(): string {
    return generateAuthHash(this.apiKey, this.serverIp)
  }

  /**
   * Fetch available appointment slots for a given date range
   */
  async getAvailableSlots(
    startDate: Date,
    endDate?: Date
  ): Promise<WCOnlineScheduleResponse> {
    if (!this.isConfigured) {
      return this.getFallbackSlots()
    }

    const params = new URLSearchParams({
      key: this.getAuthKey(),
      date: formatDateParam(startDate),
      type: "schedule",
      scheduleid: this.scheduleId,
    })

    if (endDate) {
      params.append("enddate", formatDateParam(endDate))
    }

    try {
      const response = await fetch(
        `${WCONLINE_BASE_URL}/api?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      )

      // WCOnline returns 200 with empty body if IP is not whitelisted
      const text = await response.text()
      if (!text || text.trim() === "") {
        console.warn("WCOnline returned empty response - IP may not be whitelisted")
        return this.getFallbackSlots()
      }

      if (!response.ok) {
        throw new Error(`WCOnline API error: ${response.status}`)
      }

      const data = JSON.parse(text)
      return {
        success: true,
        appointments: this.parseScheduleResponse(data),
      }
    } catch (error) {
      console.error("WCOnline API fetch error:", error)
      return this.getFallbackSlots()
    }
  }

  /**
   * Fetch tutor information
   */
  async getTutors(): Promise<WCOnlineTutorsResponse> {
    if (!this.isConfigured) {
      return this.getFallbackTutors()
    }

    const params = new URLSearchParams({
      key: this.getAuthKey(),
      type: "consultants",
      scheduleid: this.scheduleId,
    })

    try {
      const response = await fetch(
        `${WCONLINE_BASE_URL}/api?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      )

      const text = await response.text()
      if (!text || text.trim() === "") {
        console.warn("WCOnline returned empty response - IP may not be whitelisted")
        return this.getFallbackTutors()
      }

      if (!response.ok) {
        throw new Error(`WCOnline API error: ${response.status}`)
      }

      const data = JSON.parse(text)
      return {
        success: true,
        tutors: this.parseTutorsResponse(data),
      }
    } catch (error) {
      console.error("WCOnline API fetch error:", error)
      return this.getFallbackTutors()
    }
  }

  /**
   * Search for available tutors by subject
   */
  async searchTutorsBySubject(subject: string): Promise<WCOnlineTutorsResponse> {
    const response = await this.getTutors()
    if (!response.success) {
      return response
    }

    const filteredTutors = response.tutors.filter((tutor) =>
      tutor.subjects.some((s) =>
        s.toLowerCase().includes(subject.toLowerCase())
      )
    )

    return {
      success: true,
      tutors: filteredTutors,
    }
  }

  /**
   * Parse schedule response from WCOnline API
   * Note: Actual parsing depends on WCOnline's response format
   */
  private parseScheduleResponse(data: unknown): WCOnlineAppointment[] {
    // WCOnline response format may vary - this is a best-effort parser
    if (!data || typeof data !== "object") {
      return []
    }

    const dataObj = data as Record<string, unknown>

    // Try different possible response formats
    const appointments = dataObj.appointments || dataObj.slots || dataObj.data
    if (!Array.isArray(appointments)) {
      return []
    }

    return appointments.map((apt: Record<string, unknown>) => ({
      id: String(apt.id || apt.appointment_id || ""),
      tutorId: String(apt.consultant_id || apt.tutor_id || ""),
      tutorName: String(apt.consultant_name || apt.tutor_name || ""),
      date: String(apt.date || ""),
      startTime: String(apt.start_time || apt.startTime || ""),
      endTime: String(apt.end_time || apt.endTime || ""),
      subject: apt.subject ? String(apt.subject) : undefined,
      location: apt.location ? String(apt.location) : undefined,
      status: (apt.status as "available" | "booked" | "unavailable") || "available",
    }))
  }

  /**
   * Parse tutors response from WCOnline API
   */
  private parseTutorsResponse(data: unknown): WCOnlineTutor[] {
    if (!data || typeof data !== "object") {
      return []
    }

    const dataObj = data as Record<string, unknown>
    const tutors = dataObj.consultants || dataObj.tutors || dataObj.data
    if (!Array.isArray(tutors)) {
      return []
    }

    return tutors.map((tutor: Record<string, unknown>) => ({
      id: String(tutor.id || ""),
      name: String(tutor.name || ""),
      subjects: Array.isArray(tutor.subjects)
        ? tutor.subjects.map(String)
        : [],
      bio: tutor.bio ? String(tutor.bio) : undefined,
    }))
  }

  /**
   * Fallback to static data when API is unavailable
   */
  private getFallbackSlots(): WCOnlineScheduleResponse {
    // Generate mock available slots based on static tutor data
    const today = new Date()
    const appointments: WCOnlineAppointment[] = []

    stemCenterInfo.tutors.forEach((tutor, index) => {
      // Create a few sample slots for the next 7 days
      for (let day = 0; day < 7; day++) {
        const slotDate = new Date(today)
        slotDate.setDate(today.getDate() + day)

        appointments.push({
          id: `fallback-${index}-${day}`,
          tutorId: `tutor-${index}`,
          tutorName: tutor.name,
          date: slotDate.toISOString().split("T")[0],
          startTime: "11:00 AM",
          endTime: "12:00 PM",
          subject: tutor.subjects[0],
          status: "available",
        })
      }
    })

    return {
      success: true,
      appointments,
      error: "Using cached data - real-time availability may differ. Please visit the scheduling system for accurate information.",
    }
  }

  /**
   * Fallback to static tutor data
   */
  private getFallbackTutors(): WCOnlineTutorsResponse {
    const tutors: WCOnlineTutor[] = stemCenterInfo.tutors.map((tutor, index) => ({
      id: `tutor-${index}`,
      name: tutor.name,
      subjects: tutor.subjects,
      bio: `Available: ${tutor.schedule}`,
    }))

    return {
      success: true,
      tutors,
      error: "Using cached data - please visit the scheduling system for the most up-to-date tutor information.",
    }
  }
}

// Export singleton instance
export const wconlineClient = new WCOnlineClient()
