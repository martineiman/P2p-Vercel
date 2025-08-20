import { type NextRequest, NextResponse } from "next/server";
import { getAllUsers, getSessionUser } from "@/lib/database";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Processing /api/users request");
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    console.log("Session ID:", sessionId);
    if (!sessionId) {
      console.log("No session ID found");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = getSessionUser(sessionId);
    console.log("Session user:", user);
    if (!user) {
      console.log("Invalid session");
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const users = getAllUsers();
    console.log("Users retrieved:", users);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in /api/users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios: " + (error.message || error) }, { status: 500 });
  }
}