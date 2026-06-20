import { redirect } from "next/navigation";
import { ButtonLink, Panel, Pill, ScreenShell, SectionLabel } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getDailyPlanByDate } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function AiPlanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const todayPlan = await getDailyPlanByDate(todayDateKey(), user.id);

  if (!todayPlan) {
    throw new Error("Plan data is missing. Run npm run db:reset first.");
  }

  return (
    <ScreenShell title="AI 学习计划" action={<span>明日预览</span>}>
      <div className="ai-plan">
        <div className="panel-title-row">
          <div>
            <SectionLabel>个性化推荐</SectionLabel>
            <h1>根据今天的表现，自动生成明日任务</h1>
          </div>
          <ButtonLink href="/parent/plan" variant="soft">调整计划</ButtonLink>
        </div>
        <div className="ai-plan-grid">
          <Panel>
            <h3>推荐原因</h3>
            <div style={{ display: "grid", gap: 18, marginTop: 26 }}>
              {todayPlan.reason.map((reason) => (
                <div className="mini-card" key={reason}>
                  <strong>{reason}</strong>
                  <p>这条原因会进入明日计划说明，家长可以查看和调整。</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="panel-title-row">
              <h3>明日 {todayPlan.totalMinutes} 分钟计划</h3>
              <Pill>{todayPlan.headline}</Pill>
            </div>
            <div className="plan-list">
              {todayPlan.tasks.map((task, index) => (
                <div className="plan-item" key={task.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                  </div>
                  <em>{task.minutes} 分钟</em>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ScreenShell>
  );
}
