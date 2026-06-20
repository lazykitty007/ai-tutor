import { redirect } from "next/navigation";
import { AssessmentCard } from "@/components/client/assessment-card";
import { ScreenShell } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AssessmentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ScreenShell title="初始测评" action={<span>还剩 6 题</span>}>
      <AssessmentCard />
    </ScreenShell>
  );
}
