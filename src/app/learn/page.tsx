import { redirect } from "next/navigation";
import { ButtonLink, CircleIcon, LockIcon, ProgressBars, ScreenShell, StudyDeskArt } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { todayDateKey } from "@/lib/api/learning-events";
import { getActiveChildProfile, getDailyPlanByDate } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

const taskHref: Record<string, string> = {
  "literacy-review": "/learn/tasks/literacy",
  "pinyin-speaking": "/learn/tasks/pinyin",
  "math-sense": "/learn/tasks/math",
  "new-words": "/learn/tasks/literacy",
};

export default async function LearnPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [childProfile, todayPlan] = await Promise.all([
    getActiveChildProfile(user.id),
    getDailyPlanByDate(todayDateKey(), user.id),
  ]);

  if (!childProfile || !todayPlan) {
    redirect("/login");
  }

  return (
    <ScreenShell
      title={`早上好，${childProfile.name}`}
      action={
        <>
          <LockIcon />
          <a href="/parent/gate">家长入口</a>
        </>
      }
      art={false}
      className="learn-home-shell"
      showBackToLearn={false}
    >
      <div className="home-layout">
        <section>
          <div className="home-title">
            <p className="minutes">
              今天学习 <strong>{todayPlan.totalMinutes}</strong> 分钟
            </p>
            <h1>识字</h1>
            <p style={{ marginTop: 30, maxWidth: 420 }}>认识汉字，理解意思，让表达更清楚。</p>
          </div>
          <div className="lesson-progress">
            <strong>
              第 <span style={{ color: "var(--green)", fontSize: 34 }}>6</span> /10 课
            </strong>
            <ProgressBars value={5} total={7} />
          </div>
          <ButtonLink href="/learn/tasks/literacy">开始学习 →</ButtonLink>
        </section>
        <section>
          <StudyDeskArt />
          <div className="task-list">
            {todayPlan.tasks.slice(1, 4).map((task) => (
              <a className="task-row" href={taskHref[task.id]} key={task.id}>
                <CircleIcon>{getTaskIcon(task.type)}</CircleIcon>
                <span>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </span>
                <span className="count">
                  已完成 <strong>{task.progress}</strong> /10 课
                  <ProgressBars value={Math.max(1, Math.round(task.progress / 2))} total={5} />
                </span>
                <span style={{ fontSize: 34 }}>›</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </ScreenShell>
  );
}

function getTaskIcon(type: string) {
  switch (type) {
    case "pinyin":
      return (
        <svg className="task-type-icon" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 5.5c-2.6 0-4.7 2.1-4.7 4.8v5.4c0 2.7 2.1 4.8 4.7 4.8s4.7-2.1 4.7-4.8v-5.4c0-2.7-2.1-4.8-4.7-4.8Z" />
          <path d="M7.8 15.3c0 4.7 3.5 8.2 8.2 8.2s8.2-3.5 8.2-8.2" />
          <path d="M16 23.5v3.8M11.6 27.3h8.8" />
          <path d="M25.6 11.5c1.3 1.2 2 2.8 2 4.5s-.7 3.3-2 4.5" className="icon-soft-stroke" />
        </svg>
      );
    case "math":
      return (
        <svg className="task-type-icon" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="7" y="5.5" width="18" height="21" rx="4" />
          <path d="M10.4 12.4h11.2" />
          <circle cx="11.3" cy="17.1" r="1.15" />
          <circle cx="16" cy="17.1" r="1.15" />
          <circle cx="20.7" cy="17.1" r="1.15" />
          <circle cx="11.3" cy="21.7" r="1.15" />
          <circle cx="16" cy="21.7" r="1.15" />
          <circle cx="20.7" cy="21.7" r="1.15" />
        </svg>
      );
    case "focus":
      return "星";
    default:
      return (
        <svg className="task-type-icon" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M7.5 7.2h7.1c1.3 0 2.4.4 3.3 1.1v18.2c-.9-.7-2-1.1-3.3-1.1H7.5V7.2Z" />
          <path d="M24.5 7.2h-7.1c-1.3 0-2.4.4-3.3 1.1v18.2c.9-.7 2-1.1 3.3-1.1h7.1V7.2Z" />
          <path d="M10.6 12.2h3.4M10.6 16h3.9M18.1 12.2h3.3M18.1 16h3.9" className="icon-soft-stroke" />
        </svg>
      );
  }
}
