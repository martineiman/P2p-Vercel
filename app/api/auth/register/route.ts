import { type NextRequest, NextResponse } from "next/server"
import { createUser, createSession } from "@/lib/database"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, department, position } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, contraseña y nombre son requeridos" }, { status: 400 })
    }

    const user = await createUser(email, password, name, department, position)
    const sessionId = createSession(user.id as number)

    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
