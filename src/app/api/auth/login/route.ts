import { NextResponse } from "next/server";
import { createSessionForUser, verifyUserPassword } from "@/lib/auth/repository";
import { setSessionCookie } from "@/lib/auth/session";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginPayload | null;

  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PAYLOAD", message: "email and password are required" } },
      { status: 400 },
    );
  }

  const user = await verifyUserPassword(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_CREDENTIALS", message: "email or password is invalid" } },
      { status: 401 },
    );
  }

  const session = await createSessionForUser(user.id, request.headers.get("user-agent") || undefined);
  const response = NextResponse.json({ ok: true, data: { user } });
  setSessionCookie(response, session);
  return response;
}
