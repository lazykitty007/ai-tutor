import { redirect } from "next/navigation";
import { ParentGate } from "@/components/client/parent-gate";
import { ScreenShell } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ParentGatePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ScreenShell title="家长入口" action={<span>验证后进入</span>}>
      <ParentGate />
    </ScreenShell>
  );
}
