import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenShell } from "@/components/primitives";

describe("ScreenShell", () => {
  it("shows a return-to-learning icon link by default", () => {
    render(
      <ScreenShell title="识字练习">
        <p>练习内容</p>
      </ScreenShell>,
    );

    const link = screen.getByRole("link", { name: "返回每日旅程" });
    expect(link).toHaveAttribute("href", "/learn");
    expect(link.querySelector(".brand-back-icon")).not.toBeNull();
  });

  it("can hide the return icon on the learning home page", () => {
    render(
      <ScreenShell showBackToLearn={false} title="早上好，小宇">
        <p>首页内容</p>
      </ScreenShell>,
    );

    expect(screen.getByRole("link", { name: "早上好，小宇" }).querySelector(".brand-back-icon")).toBeNull();
  });
});
