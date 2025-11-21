import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SECRET = process.env.TOKEN_SECRET || "dev-secret"
const API_PASS = process.env.API_AUTH_PASSWORD || ""

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const pass = body.password || ""

    // If password is set in env, require it. Otherwise allow in dev.
    if (API_PASS && pass !== API_PASS) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const token = jwt.sign({ issued: Date.now() }, SECRET, { expiresIn: "10m" })
    return NextResponse.json({ token })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Unable to create token" }, { status: 500 })
  }
}

