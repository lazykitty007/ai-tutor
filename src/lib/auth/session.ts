import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getUserBySessionToken, revokeSessionToken, type SessionToken, type UserAccount } from "./repository";

export const SESSION_COOKIE_NAME = "ai_tutor_session";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function setSessionCookie(response: NextResponse, session: SessionToken): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const cookieStore = await cookies();
  return getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  await revokeSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
