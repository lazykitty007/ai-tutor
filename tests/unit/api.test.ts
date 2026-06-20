import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/auth/session";
import { createChildProfile, getDailyPlanByDate, recordLearningEvents } from "@/lib/db/repositories";
import { POST as postCreateChild } from "@/app/api/children/route";
import { POST as postLearningEvents } from "@/app/api/learning/events/route";
import { GET as getTodayPlan } from "@/app/api/plans/today/route";

vi.mock("@/lib/db/repositories", () => ({
  createChildProfile: vi.fn(),
  getDailyPlanByDate: vi.fn(),
  recordLearningEvents: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

describe("api route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user_seed_parent",
      email: "parent@example.com",
      displayName: "小宇家长",
    });
    vi.mocked(getDailyPlanByDate).mockResolvedValue({
      id: "plan_seed_today",
      childId: "child_seed",
      childName: "小宇",
      targetDate: "2026-06-19",
      totalMinutes: 20,
      headline: "识字为主，数感巩固",
      reason: ["最近字形混淆需要先复习"],
      tasks: [
        {
          id: "literacy-review",
          type: "literacy",
          title: "先复习林、木、森",
          description: "观察字形，理解意思，能读会用。",
          minutes: 6,
          progress: 6,
          total: 10,
          knowledgeIds: ["char-lin", "char-mu"],
          questionIds: ["q_char_lintone"],
          status: "in_progress",
          sortOrder: 1,
        },
        {
          id: "math-sense",
          type: "math",
          title: "数感小游戏",
          description: "理解数量，比较多少，解决问题。",
          minutes: 4,
          progress: 3,
          total: 10,
          knowledgeIds: ["math-compare"],
          questionIds: ["q_math_compare_7_5"],
          status: "in_progress",
          sortOrder: 2,
        },
        {
          id: "new-words",
          type: "literacy",
          title: "新字学习",
          description: "学习 1-2 个和木字旁相关的新字。",
          minutes: 6,
          progress: 0,
          total: 10,
          knowledgeIds: ["char-xiu"],
          questionIds: [],
          status: "not_started",
          sortOrder: 3,
        },
      ],
    });
    vi.mocked(recordLearningEvents).mockResolvedValue([
      { clientEventId: "evt-1", status: "accepted", duplicate: false },
    ]);
    vi.mocked(createChildProfile).mockResolvedValue({
      id: "child_new",
      name: "贝贝",
      ageBand: "4-5 岁",
      stage: "中班",
      dailyMinutes: 15,
      goals: ["literacy", "pinyin", "math"],
      isActive: true,
    });
  });

  it("returns today's plan", async () => {
    const response = await getTodayPlan();
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data.totalMinutes).toBe(20);
    expect(json.data.tasks.length).toBeGreaterThanOrEqual(3);
    expect(getDailyPlanByDate).toHaveBeenCalledWith(expect.any(String), "user_seed_parent");
  });

  it("persists valid learning events through the MySQL repository and reports rejected events", async () => {
    const request = new Request("http://test.local/api/learning/events", {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            clientEventId: "evt-1",
            childId: "child_seed",
            eventType: "item_answered",
            payload: { isCorrect: true },
          },
          {
            clientEventId: "evt-2",
            childId: "child-1",
            eventType: "unknown",
          },
        ],
      }),
    });

    const response = await postLearningEvents(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(recordLearningEvents).toHaveBeenCalledWith(
      [
        {
          childId: "child_seed",
          clientEventId: "evt-1",
          eventType: "item_answered",
          knowledgeIds: [],
          payload: { isCorrect: true },
        },
      ],
      "user_seed_parent",
    );
    expect(json.data.accepted).toEqual([
      { clientEventId: "evt-1", status: "accepted", duplicate: false },
    ]);
    expect(json.data.rejected).toBe(1);
  });

  it("rejects unauthenticated learning event writes", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const request = new Request("http://test.local/api/learning/events", {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            clientEventId: "evt-1",
            childId: "child_seed",
            eventType: "item_answered",
            payload: { isCorrect: true },
          },
        ],
      }),
    });

    const response = await postLearningEvents(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(recordLearningEvents).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid learning event payloads", async () => {
    const request = new Request("http://test.local/api/learning/events", {
      method: "POST",
      body: JSON.stringify({ events: "bad" }),
    });

    const response = await postLearningEvents(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it("derives child plan defaults from age when onboarding omits goal and duration", async () => {
    const request = new Request("http://test.local/api/children", {
      method: "POST",
      body: JSON.stringify({
        nickname: "贝贝",
        ageBand: "4-5 岁",
        stage: "中班",
      }),
    });

    const response = await postCreateChild(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(createChildProfile).toHaveBeenCalledWith("user_seed_parent", {
      nickname: "贝贝",
      ageBand: "4-5 岁",
      stage: "中班",
      dailyMinutes: 15,
      goals: ["literacy", "pinyin", "math"],
    });
  });
});
