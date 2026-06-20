import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskPractice } from "@/components/client/task-practice";
import { taskMap } from "@/lib/demo-data";

describe("TaskPractice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a hint after a wrong literacy answer", () => {
    render(<TaskPractice task={taskMap.literacy} />);

    fireEvent.click(screen.getByRole("button", { name: "从" }));

    expect(screen.getByText(/小提示/)).toBeInTheDocument();
    expect(screen.getByText(/两个一样的部分/)).toBeInTheDocument();
  });

  it("advances after a correct literacy answer", () => {
    render(<TaskPractice task={taskMap.literacy} />);

    fireEvent.click(screen.getByRole("button", { name: "双" }));
    fireEvent.click(screen.getByRole("button", { name: "下一题 →" }));

    expect(screen.getByText("AI 提示：")).toBeInTheDocument();
  });

  it("keeps the child on the same question when event persistence fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false }),
    } as Response);

    render(<TaskPractice childId="child_seed" planId="plan_seed_today" task={taskMap.literacy} />);

    fireEvent.click(screen.getByRole("button", { name: "双" }));
    fireEvent.click(screen.getByRole("button", { name: "下一题 →" }));

    await expect(screen.findByRole("alert")).resolves.toHaveTextContent("学习记录没有保存成功，请检查网络后重试。");
    expect(screen.getByRole("button", { name: "重试保存 →" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "双" })).toHaveClass("selected");
    expect(screen.queryByText("AI 提示：")).not.toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
  });
});
