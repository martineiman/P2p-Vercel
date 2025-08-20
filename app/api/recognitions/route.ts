import { type NextRequest, NextResponse } from "next/server";
import { getRecognitions, getSessionUser } from "@/lib/database";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Processing /api/recognitions request");
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

    const recognitions = getRecognitions();
    console.log("Recognitions retrieved:", recognitions);
    return NextResponse.json({ recognitions });
  } catch (error) {
    console.error("Error in /api/recognitions:", error);
    return NextResponse.json({ error: "Error al obtener reconocimientos: " + (error.message || error) }, { status: 500 });
  }
}