import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getReportByDate } from "@/lib/db/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "login is required" } },
      { status: 401 },
    );
  }

  const { date } = await params;
  const reportDate = date === "today" ? todayDateKey() : date;
  const report = await getReportByDate(reportDate, user.id);

  if (!report) {
    return NextResponse.json(
      { ok: false, error: { code: "REPORT_NOT_FOUND", message: "report was not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      date: reportDate,
      ...report,
    },
  });
}
