import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { parseLearningEventsBody } from "@/lib/api/learning-events";
import { recordLearningEvents } from "@/lib/db/repositories";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "login is required" } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseLearningEventsBody(body);

  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PAYLOAD", message: "events must be an array" } },
      { status: 400 },
    );
  }

  if (!parsed.accepted.length) {
    return NextResponse.json({
      ok: true,
      data: {
        accepted: [],
        rejected: parsed.rejected,
        serverTime: new Date().toISOString(),
      },
    });
  }

  const accepted = await recordLearningEvents(parsed.accepted, user.id);

  return NextResponse.json({
    ok: true,
    data: {
      accepted,
      rejected: parsed.rejected,
      serverTime: new Date().toISOString(),
    },
  });
}
