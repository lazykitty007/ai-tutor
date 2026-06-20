import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanEditor } from "@/components/client/plan-editor";

describe("PlanEditor", () => {
  it("renders relaxed plan by default and updates duration", () => {
    render(<PlanEditor />);

    expect(screen.getByText("明日计划预览")).toBeInTheDocument();
    expect(screen.getByText("轻松复习日")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "30 分钟" }));

    expect(screen.getByText("30 分钟")).toHaveClass("active");
  });

  it("can turn off relaxed mode and show new word learning", () => {
    render(<PlanEditor />);

    fireEvent.click(screen.getByRole("button", { name: /轻松模式/ }));

    expect(screen.getByText("识字为主，数感巩固")).toBeInTheDocument();
    expect(screen.getByText("新字学习")).toBeInTheDocument();
  });
});
