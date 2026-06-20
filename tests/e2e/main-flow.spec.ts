import { expect, test, type Page } from "@playwright/test";

async function loginSeedParent(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "懂儿童心理学的 AI 助教" })).toBeVisible();
  await expect(page.getByText("服务端保存")).toHaveCount(0);
  await expect(page.getByLabel("孩子昵称")).toHaveCount(0);
  await page.getByLabel("家长邮箱").fill("parent@example.com");
  await page.getByLabel("账号密码").fill("parent1234");
  await page.getByRole("button", { name: "登录并继续 →" }).click();
  await expect(page).toHaveURL(/\/learn$/);
}

test("unauthenticated users are sent to login before child and parent flows", async ({ page }) => {
  await page.goto("/assessment", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/learn/complete", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/parent/gate", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login$/);
});

test("seed parent can log in, complete a task event, and read the report", async ({ page }) => {
  await loginSeedParent(page);

  await expect(page.getByRole("heading", { name: "识字" })).toBeVisible();
  await expect(page.getByRole("link", { name: /开始学习/ })).toHaveAttribute("href", "/learn/tasks/literacy");
  await page.goto("/learn/tasks/literacy", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "认识 “林”" })).toBeVisible();
  await page.getByRole("button", { name: "双" }).click();
  await page.getByRole("button", { name: "下一题 →" }).click();
  await expect(page.getByText("AI 提示：")).toBeVisible();
  await expect(page.getByText("学习记录没有保存成功，请检查网络后重试。")).toHaveCount(0);

  await page.goto("/parent/gate", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "7" }).click({ force: true });
  await expect(page.getByRole("link", { name: "进入家长中心 →" })).toHaveAttribute("href", "/parent/dashboard");
  await page.goto("/parent/dashboard", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("今日摘要")).toBeVisible();
  await expect(page.getByRole("link", { name: "调整明日计划" })).toHaveAttribute("href", "/parent/plan");
  await page.goto("/parent/plan", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("明日计划预览")).toBeVisible();
  await expect(page.getByText("轻松复习日")).toBeVisible();

  await page.goto("/parent/reports/today", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("今日一句话")).toBeVisible();
  await expect(page.getByText("明日建议")).toBeVisible();

  await page.goto("/parent/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "退出账号" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login$/);
});

test("new parent can register, create a child profile, and enter the learning flow", async ({ page }) => {
  const email = `new-parent-${Date.now()}@example.com`;

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "创建新账号" }).click();
  await page.getByLabel("家长邮箱").fill(email);
  await page.getByLabel("账号密码").fill("register1234");
  await expect(page.getByLabel("家长称呼")).toHaveCount(0);
  await expect(page.getByLabel("今日目标")).toHaveCount(0);
  await expect(page.getByLabel("每日学习时长")).toHaveCount(0);
  await page.getByLabel("孩子昵称").fill("贝贝");
  await page.getByRole("button", { name: "创建账号并继续 →" }).click();

  await expect(page).toHaveURL(/\/assessment$/);
  await expect(page.getByRole("heading", { name: /哪个字读作/ })).toBeVisible();
  await page.getByRole("button", { name: "林 树林" }).click();
  await expect(page.getByText("选对了")).toBeVisible();
  await page.getByRole("button", { name: "进入今日学习 →" }).click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("link", { name: "早上好，贝贝" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "识字" })).toBeVisible();
});
