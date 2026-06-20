"use client";

import { useState, type FormEvent } from "react";
import { AppButton } from "@/components/primitives";

export function OnboardingForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isRegister = mode === "register";
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("parent1234");
  const [nickname, setNickname] = useState("小宇");
  const [ageStage, setAgeStage] = useState("5-6 岁 · 幼小衔接");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const authResponse = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (!authResponse?.ok) {
      setSubmitting(false);
      setError(isRegister ? "账号创建失败，请换一个邮箱或稍后重试。" : "账号或密码不正确，请重试。");
      return;
    }

    if (!isRegister) {
      setSubmitting(false);
      window.location.assign("/learn");
      return;
    }

    const [ageBand, stage = "幼小衔接"] = ageStage.split(" · ");
    const profileResponse = await fetch("/api/children", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nickname,
        ageBand,
        stage,
      }),
    }).catch(() => null);

    setSubmitting(false);

    if (!profileResponse?.ok) {
      setError("网络不稳定，建档失败，请重试。");
      return;
    }

    window.location.assign("/assessment");
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="segmented" aria-label="账号操作">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
          登录已有账号
        </button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
          创建新账号
        </button>
      </div>
      <label className="field-row">
        <span>邮箱</span>
        <input aria-label="家长邮箱" inputMode="email" onChange={(event) => setEmail(event.target.value)} value={email} />
      </label>
      <label className="field-row">
        <span>密码</span>
        <input aria-label="账号密码" minLength={8} onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </label>
      {isRegister ? (
        <>
          <label className="field-row">
            <span>昵称</span>
            <input aria-label="孩子昵称" onChange={(event) => setNickname(event.target.value)} value={nickname} />
          </label>
          <label className="field-row">
            <span>年龄阶段</span>
            <select aria-label="年龄阶段" onChange={(event) => setAgeStage(event.target.value)} value={ageStage}>
              <option>3-4 岁 · 启蒙</option>
              <option>4-5 岁 · 中班</option>
              <option>5-6 岁 · 幼小衔接</option>
            </select>
          </label>
        </>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <AppButton type="submit">{submitting ? "正在处理..." : isRegister ? "创建账号并继续 →" : "登录并继续 →"}</AppButton>
    </form>
  );
}
