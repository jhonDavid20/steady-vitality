import { type NextRequest, NextResponse } from "next/server"
import { assessmentPayloadSchema } from "@steady/shared"

// Base URL of the Steady Vitality backend API (server-side only, no NEXT_PUBLIC_).
// When unset (e.g. a standalone landing deploy without a backend), the route
// degrades gracefully: it logs the submission and still returns success.
const API_URL = process.env.API_URL

export async function POST(request: NextRequest) {
  try {
    const parsed = assessmentPayloadSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid assessment data", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data = parsed.data

    if (!API_URL) {
      console.warn("API_URL not configured — logging assessment instead of persisting:", data)
      return NextResponse.json({ success: true, message: "Assessment received" })
    }

    const response = await fetch(`${API_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("Backend rejected assessment:", response.status, detail)
      return NextResponse.json(
        { success: false, message: "Failed to submit assessment" },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Assessment submitted successfully",
    })
  } catch (error) {
    console.error("Assessment submission error:", error)
    return NextResponse.json({ success: false, message: "Failed to submit assessment" }, { status: 500 })
  }
}
