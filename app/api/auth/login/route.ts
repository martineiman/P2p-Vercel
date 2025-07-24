import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, createSession } from "@/lib/database"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)
    const sessionId = createSession(user.id)

    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
