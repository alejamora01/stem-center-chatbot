import * as XLSX from "xlsx"

export type TutorAvailability = {
  timeSlot: string
  tutors: {
    name: string
    availability: number
  }[]
}

export type SheetData = {
  sheetName: string
  data: any[]
}

export function readExcelFile(filePath: string): SheetData[] {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath)
    const result: SheetData[] = []

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]

      // Convert sheet to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // Filter out empty rows
      const filteredData = data.filter(
        (row) => Array.isArray(row) && row.length > 0 && !row.every((cell) => cell === undefined || cell === ""),
      )

      result.push({
        sheetName,
        data: filteredData,
      })
    })

    return result
  } catch (error) {
    console.error("Error reading Excel file:", error)
    throw error
  }
}

export function processTutorAvailability(data: any[]): TutorAvailability[] {
  // Skip header rows (assuming first 3 rows are headers)
  const dataWithoutHeaders = data.slice(3)

  // Extract column headers (tutor names) from the first row
  const headers = data[2] as string[]
  const tutorNames = headers.slice(1) // Skip the first column which is time slots

  const result: TutorAvailability[] = []

  // Process each row (time slot)
  dataWithoutHeaders.forEach((row) => {
    if (!row || row.length === 0) return

    const timeSlot = row[0]
    if (!timeSlot) return

    const tutors = []

    // Process each tutor's availability for this time slot
    for (let i = 1; i < row.length && i <= tutorNames.length; i++) {
      if (tutorNames[i - 1]) {
        tutors.push({
          name: tutorNames[i - 1],
          availability: row[i] !== undefined ? row[i] : 0,
        })
      }
    }

    result.push({
      timeSlot,
      tutors,
    })
  })

  return result
}
