import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createChildProfile } from "@/lib/db/repositories";

type CreateChildPayload = {
  nickname?: unknown;
  ageBand?: unknown;
  stage?: unknown;
  dailyMinutes?: unknown;
  goals?: unknown;
};

function getProfileDefaultsByAge(ageBand: string): { dailyMinutes: number; goals: string[] } {
  if (ageBand.startsWith("3-4")) {
    return { dailyMinutes: 10, goals: ["literacy", "math"] };
  }
  if (ageBand.startsWith("4-5")) {
    return { dailyMinutes: 15, goals: ["literacy", "pinyin", "math"] };
  }
  return { dailyMinutes: 20, goals: ["literacy", "pinyin", "math"] };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "login is required" } },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as CreateChildPayload | null;

  if (!body || typeof body.nickname !== "string" || typeof body.ageBand !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PAYLOAD", message: "nickname and ageBand are required" } },
      { status: 400 },
    );
  }

  const ageBand = body.ageBand.trim();
  const defaults = getProfileDefaultsByAge(ageBand);
  const goals = Array.isArray(body.goals)
    ? body.goals.filter((goal): goal is string => typeof goal === "string")
    : defaults.goals;

  const profile = await createChildProfile(
    user.id,
    {
      nickname: body.nickname.trim() || "小朋友",
      ageBand,
      stage: typeof body.stage === "string" ? body.stage : "幼小衔接",
      dailyMinutes: typeof body.dailyMinutes === "number" ? body.dailyMinutes : defaults.dailyMinutes,
      goals: goals.length > 0 ? goals : defaults.goals,
    },
  );

  return NextResponse.json({
    ok: true,
    data: profile,
  });
}
