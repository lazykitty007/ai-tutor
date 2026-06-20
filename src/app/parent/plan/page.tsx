import { redirect } from "next/navigation";
import { PlanEditor } from "@/components/client/plan-editor";
import { ScreenShell } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveChildProfile, getKnowledgeNodes, getMasteryRecordsForActiveChild } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function ParentPlanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [childProfile, knowledgeNodes, masteryRecords] = await Promise.all([
    getActiveChildProfile(user.id),
    getKnowledgeNodes(),
    getMasteryRecordsForActiveChild(user.id),
  ]);

  if (!childProfile) {
    throw new Error("Active child profile is missing. Run npm run db:reset first.");
  }

  return (
    <ScreenShell title="明日计划调整" action={<span>家长可控</span>}>
      <PlanEditor
        childName={childProfile.name}
        initialMinutes={childProfile.dailyMinutes}
        knowledgeNodes={knowledgeNodes}
        masteryRecords={masteryRecords}
      />
    </ScreenShell>
  );
}
