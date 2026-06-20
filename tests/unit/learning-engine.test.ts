import { describe, expect, it } from "vitest";
import {
  computeReviewPriority,
  generateDailyPlan,
  pickReviewNodes,
  updateMastery,
  type MasteryRecord,
} from "@/lib/learning-engine";
import { knowledgeNodes, masteryRecords } from "@/lib/demo-data";

const baseRecord: MasteryRecord = {
  knowledgeId: "char-lin",
  masteryScore: 64,
  exposureCount: 8,
  correctCount: 5,
  wrongCount: 3,
  hintCount: 2,
  lastPracticedDaysAgo: 2,
  weaknessTags: ["字形混淆"],
};

describe("learning engine", () => {
  it("raises mastery for fast correct answers", () => {
    const next = updateMastery(baseRecord, {
      knowledgeId: "char-lin",
      isCorrect: true,
      durationMs: 3000,
      hintCount: 0,
    });

    expect(next.masteryScore).toBeGreaterThan(baseRecord.masteryScore);
    expect(next.correctCount).toBe(baseRecord.correctCount + 1);
  });

  it("penalizes repeated wrong answers and adds weakness tag", () => {
    const next = updateMastery(baseRecord, {
      knowledgeId: "char-lin",
      isCorrect: false,
      durationMs: 18000,
      hintCount: 1,
      wrongStreak: 2,
    });

    expect(next.masteryScore).toBeLessThan(baseRecord.masteryScore);
    expect(next.weaknessTags).toContain("需要多题型复习");
  });

  it("prioritizes lower mastery and repeated mistakes for review", () => {
    const reviewIds = pickReviewNodes(masteryRecords, 2);

    expect(reviewIds).toContain("char-sen");
    expect(computeReviewPriority(masteryRecords[2])).toBeGreaterThan(computeReviewPriority(masteryRecords[1]));
  });

  it("generates relaxed plans without new knowledge tasks", () => {
    const plan = generateDailyPlan({
      childName: "小宇",
      targetDate: "2026-06-20",
      dailyMinutes: 20,
      records: masteryRecords,
      nodes: knowledgeNodes,
      relaxedMode: true,
    });

    expect(plan.headline).toBe("轻松复习日");
    expect(plan.tasks).toHaveLength(4);
    expect(plan.tasks.at(-1)?.knowledgeIds).toEqual([]);
  });
});
