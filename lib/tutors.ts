import fs from "fs"
import path from "path"
import { stemCenterInfo } from "./stem-center-data"

export type Tutor = {
  id: string
  name: string
  subjects: string[]
  schedule?: string
  email?: string
}

function normalizeId(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function loadTutors(): Promise<Tutor[]> {
  const csvPath = path.join(process.cwd(), "data", "tutors.csv")

  if (fs.existsSync(csvPath)) {
    const raw = await fs.promises.readFile(csvPath, "utf8")
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return []
    const header = lines[0].split(",").map((h) => h.trim())
    const rows = lines.slice(1)

    const tutors: Tutor[] = rows.map((row) => {
      const cols = row.split(",").map((c) => c.trim())
      const obj: Record<string, string> = {}
      for (let i = 0; i < header.length; i++) {
        obj[header[i]] = cols[i] ?? ""
      }

      const name = obj["name"] || obj["fullName"] || ""
      const subjectsRaw = obj["subjects"] || ""
      const subjects = subjectsRaw ? subjectsRaw.split(/;|\|/) .map(s => s.trim()).filter(Boolean) : []
      const schedule = obj["schedule"] || obj["hours"] || ""
      const email = obj["email"] || ""
      const id = obj["id"] || normalizeId(name)

      return { id, name, subjects, schedule, email }
    })

    return tutors
  }

  // fallback to stemCenterInfo in case CSV is not provided
  const fallback = (stemCenterInfo.tutors || []).map((t: any) => ({
    id: normalizeId(t.name || t.id || Math.random().toString(36).slice(2)),
    name: t.name,
    subjects: t.subjects || [],
    schedule: t.schedule || "",
    email: t.email || "",
  }))

  return fallback
}
