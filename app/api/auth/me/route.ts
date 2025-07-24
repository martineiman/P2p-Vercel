import { type NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = getSessionUser(sessionId)
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}
