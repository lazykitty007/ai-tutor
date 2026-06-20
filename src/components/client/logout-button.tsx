"use client";

import { useState } from "react";
import { AppButton } from "@/components/primitives";

export function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleLogout() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(false);
    const response = await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);

    if (!response?.ok) {
      setSubmitting(false);
      setError(true);
      return;
    }

    window.location.assign("/login");
  }

  return (
    <>
      <AppButton disabled={submitting} onClick={handleLogout} variant="soft">
        {submitting ? "正在退出..." : "退出账号"}
      </AppButton>
      {error ? <p role="alert">退出失败，请稍后重试。</p> : null}
    </>
  );
}
