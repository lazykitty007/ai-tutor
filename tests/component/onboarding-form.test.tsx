import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingForm } from "@/components/client/onboarding-form";

describe("OnboardingForm", () => {
  it("does not offer a switch to disable MySQL persistence", () => {
    render(<OnboardingForm />);

    expect(screen.getByRole("button", { name: "登录已有账号" })).toHaveClass("active");
    expect(screen.queryByText("服务端保存")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /服务端保存/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("家长邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("账号密码")).toBeInTheDocument();
    expect(screen.queryByLabelText("孩子昵称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("年龄阶段")).not.toBeInTheDocument();
  });

  it("keeps registration fields focused on account, child name, and age", () => {
    render(<OnboardingForm />);

    fireEvent.click(screen.getByRole("button", { name: "创建新账号" }));

    expect(screen.getByLabelText("家长邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("账号密码")).toBeInTheDocument();
    expect(screen.getByLabelText("孩子昵称")).toBeInTheDocument();
    expect(screen.getByLabelText("年龄阶段")).toBeInTheDocument();
    expect(screen.queryByLabelText("家长称呼")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("今日目标")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("每日学习时长")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建账号并继续 →" })).toBeInTheDocument();
    expect(screen.queryByText("创建账号并开始测评 →")).not.toBeInTheDocument();
  });
});
