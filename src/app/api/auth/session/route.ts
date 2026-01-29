import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    await createSession(idToken);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session creation error:", error);

    const message = error instanceof Error ? error.message : "Failed to create session";

    // Return appropriate status code based on error
    if (message === "User not authorized" || message === "User account is disabled") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
