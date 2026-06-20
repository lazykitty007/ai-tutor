import { redirect } from "next/navigation";
import { Panel, Pill, ScreenShell, Stat } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getReportByDate } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ date: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { date } = await params;
  const reportDate = date === "today" ? todayDateKey() : date;
  const report = await getReportByDate(reportDate, user.id);

  if (!report) {
    throw new Error("Report data is missing. Run npm run db:reset first.");
  }

  return (
    <ScreenShell title="学情报告" action={<span>{reportDate}</span>}>
      <Panel>
        <p className="section-label">今日一句话</p>
        <h2>{report.summary}</h2>
      </Panel>
      <div className="report-grid" style={{ marginTop: 34 }}>
        <Panel>
          <h3>学习概览</h3>
          <div className="stat-grid">
            <Stat value={String(report.stats.answeredCount)} label="作答题数" />
            <Stat value={`${Math.round(report.stats.correctRate * 100)}%`} label="正确率" />
            <Stat value={String(report.stats.hintCount)} label="提示次数" />
          </div>
          {report.weaknesses.map((weakness) => (
            <div className="weak-row" key={weakness.knowledgeId}>
              <strong>{weakness.title}</strong>
              <span>{weakness.reason}</span>
              <Pill>明日复习</Pill>
            </div>
          ))}
        </Panel>
        <Panel>
          <h3>明日建议</h3>
          {report.strengths.map((strength) => (
            <div className="mini-card" key={strength} style={{ marginTop: 18 }}>
              <strong>{strength}</strong>
              <p>继续用短任务保持稳定节奏。</p>
            </div>
          ))}
          <div className="mini-card" style={{ marginTop: 18 }}>
            <strong>先复习木字旁</strong>
            <p>{report.tomorrowSuggestion}</p>
          </div>
        </Panel>
      </div>
    </ScreenShell>
  );
}
