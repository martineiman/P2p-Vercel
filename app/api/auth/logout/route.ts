import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/database"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (sessionId) {
      deleteSession(sessionId)
    }

    cookieStore.delete("session")

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
  }
}
