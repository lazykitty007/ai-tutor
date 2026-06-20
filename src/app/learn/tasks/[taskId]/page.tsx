import { notFound, redirect } from "next/navigation";
import { TaskPractice } from "@/components/client/task-practice";
import { ScreenShell } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getDailyPlanByDate } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { taskId } = await params;
  const plan = await getDailyPlanByDate(todayDateKey(), user.id);
  const task = plan?.tasks.find((item) => item.type === taskId || item.id === taskId);

  if (!plan || !task) {
    notFound();
  }

  return (
    <ScreenShell title={task.type === "math" ? "数感练习" : task.type === "pinyin" ? "拼音与听说" : "识字练习"} action={<span>第 3 / 8 题</span>}>
      <TaskPractice childId={plan.childId} planId={plan.id} task={task} />
    </ScreenShell>
  );
}
