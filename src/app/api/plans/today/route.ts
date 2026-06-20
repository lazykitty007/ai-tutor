import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getDailyPlanByDate } from "@/lib/db/repositories";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "login is required" } },
      { status: 401 },
    );
  }

  const plan = await getDailyPlanByDate(todayDateKey(), user.id);

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: { code: "PLAN_NOT_FOUND", message: "today plan was not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: plan,
  });
}
