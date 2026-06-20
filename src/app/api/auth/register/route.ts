import { NextResponse } from "next/server";
import { createSessionForUser, registerUserWithPassword } from "@/lib/auth/repository";
import { setSessionCookie } from "@/lib/auth/session";

type RegisterPayload = {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterPayload | null;

  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PAYLOAD", message: "email and password are required" } },
      { status: 400 },
    );
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { ok: false, error: { code: "WEAK_PASSWORD", message: "password must be at least 8 characters" } },
      { status: 400 },
    );
  }

  const user = await registerUserWithPassword({
    email: body.email,
    password: body.password,
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
  });
  const session = await createSessionForUser(user.id, request.headers.get("user-agent") || undefined);
  const response = NextResponse.json({ ok: true, data: { user } });
  setSessionCookie(response, session);
  return response;
}
