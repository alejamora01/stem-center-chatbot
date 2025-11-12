import { NextResponse } from "next/server"
import { loadTutors } from "@/lib/tutors"
import jwt from "jsonwebtoken"

const TOKEN_AUTH = process.env.TOKEN_AUTH === "true"
const SECRET = process.env.TOKEN_SECRET || "dev-secret"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    if (TOKEN_AUTH) {
      const auth = req.headers.get("authorization")
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : auth
      if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 })
      try {
        jwt.verify(token, SECRET)
      } catch (err) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    const tutors = await loadTutors()
    const tutor = tutors.find((t) => t.id === params.id)
    if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ tutor })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to load tutor" }, { status: 500 })
  }
}
