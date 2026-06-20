import { redirect } from "next/navigation";
import { ButtonLink, Panel, Pill, ScreenShell, Stat } from "@/components/primitives";
import { LogoutButton } from "@/components/client/logout-button";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getActiveChildProfile, getMasteryRecordsForActiveChild, getReportByDate } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [childProfile, masteryRecords, todayReport] = await Promise.all([
    getActiveChildProfile(user.id),
    getMasteryRecordsForActiveChild(user.id),
    getReportByDate(todayDateKey(), user.id),
  ]);

  if (!childProfile || !todayReport) {
    throw new Error("Dashboard data is missing. Run npm run db:reset first.");
  }

  const weakRows = todayReport.weaknesses.length
    ? todayReport.weaknesses.map((weakness) => [weakness.title, weakness.reason, "明日优先复习"])
    : [["暂无明显薄弱点", "今日表现稳定", "保持轻量巩固"]];
  const correctRate = `${Math.round(todayReport.stats.correctRate * 100)}%`;

  return (
    <ScreenShell title="家长总览" action={<span>{childProfile.name} · 今日</span>}>
      <div className="dashboard-grid">
        <section style={{ display: "grid", gap: 34 }}>
          <Panel>
            <p className="section-label">今日摘要</p>
            <h2>{todayReport.summary}</h2>
            <p style={{ marginTop: 18 }}>{todayReport.tomorrowSuggestion}</p>
            <div className="stat-grid">
              <Stat value={String(todayReport.stats.totalMinutes)} label="学习分钟" />
              <Stat value={`${todayReport.stats.completedTaskCount}/4`} label="完成任务" />
              <Stat value={correctRate} label="正确率" />
            </div>
          </Panel>
          <Panel>
            <h3>能力趋势</h3>
            <div className="line-chart" aria-label="能力趋势图">
              <svg height="180" preserveAspectRatio="none" viewBox="0 0 520 180" width="100%">
                <polyline fill="none" points="0,142 90,126 180,132 270,92 360,82 520,46" stroke="#5E946F" strokeLinecap="round" strokeWidth="6" />
                <polyline fill="none" points="0,160 90,144 180,146 270,126 360,108 520,92" stroke="#E2B33B" strokeLinecap="round" strokeWidth="5" />
              </svg>
            </div>
          </Panel>
        </section>
        <section style={{ display: "grid", gap: 34 }}>
          <Panel>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <div className="chart-ring">
                <strong>72</strong>
              </div>
              <div>
                <h3>综合掌握度</h3>
                <p style={{ marginTop: 14 }}>较昨天提升 6 分，复习效果明显。</p>
                <Pill>建议保持 20 分钟</Pill>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="panel-title-row">
              <h3>今日薄弱点</h3>
              <ButtonLink href="/parent/knowledge" variant="soft">查看详情</ButtonLink>
            </div>
            {weakRows.map(([title, tag, action]) => (
              <div className="weak-row" key={title}>
                <strong>{title}</strong>
                <span>{tag}</span>
                <Pill>{action}</Pill>
              </div>
            ))}
          </Panel>
          <Panel>
            <h3>快捷操作</h3>
            <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <ButtonLink href="/parent/plan">调整明日计划</ButtonLink>
              <ButtonLink href="/parent/reports/today" variant="soft">查看学情报告</ButtonLink>
              <LogoutButton />
            </div>
          </Panel>
        </section>
      </div>
      <div hidden data-testid="mastery-count">
        {masteryRecords.length}
      </div>
    </ScreenShell>
  );
}
