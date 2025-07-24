import { type NextRequest, NextResponse } from "next/server"
import { createRecognition, getRecognitions, getSessionUser } from "@/lib/database"
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

    const recognitions = getRecognitions()
    return NextResponse.json({ recognitions })
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener reconocimientos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { recipientId, valueId, message } = await request.json()

    if (!recipientId || !valueId || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const recognitionId = createRecognition(user.id, recipientId, valueId, message)

    return NextResponse.json({
      success: true,
      recognitionId,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear reconocimiento" }, { status: 500 })
  }
}
