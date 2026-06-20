import { redirect } from "next/navigation";
import { ButtonLink, Panel, Pill, ProgressBars, ScreenShell, Stat } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CompletePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ScreenShell title="今日成就" action={<Pill>已完成 4 个任务</Pill>}>
      <div className="completion">
        <section>
          <p className="section-label">学习完成</p>
          <h1>今天的小目标都完成啦</h1>
          <p style={{ marginTop: 28, maxWidth: 580 }}>
            新学 3 个字，复习 7 个旧知识点。AI 已经为明天安排好更轻松的复习任务。
          </p>
          <div className="stat-grid">
            <Stat value="18" label="学习分钟" />
            <Stat value="12" label="获得星星" />
            <Stat value="5" label="连续学习天数" />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 34, flexWrap: "wrap" }}>
            <ButtonLink href="/parent/reports/today" variant="soft">查看报告</ButtonLink>
            <ButtonLink href="/learn">返回首页</ButtonLink>
          </div>
        </section>
        <Panel className="star-card">
          <strong>★</strong>
          <h2>今日星星</h2>
          <ProgressBars value={5} total={5} />
          <p>每天进步一点点，未来更棒。</p>
        </Panel>
      </div>
    </ScreenShell>
  );
}
