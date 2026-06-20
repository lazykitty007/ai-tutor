import { describe, expect, it } from "vitest";
import { mapChildProfileRow, mapDailyPlanRows, mapReportRows } from "@/lib/db/repositories";

describe("db repository mappers", () => {
  it("maps child profile rows into the UI profile shape", () => {
    expect(
      mapChildProfileRow({
        id: "child_seed",
        nickname: "小宇",
        age_band: "5-6 岁",
        stage: "幼小衔接",
        daily_minutes: 20,
        goals_json: '["literacy","math"]',
        is_active: 1,
      }),
    ).toEqual({
      id: "child_seed",
      name: "小宇",
      ageBand: "5-6 岁",
      stage: "幼小衔接",
      dailyMinutes: 20,
      goals: ["literacy", "math"],
      isActive: true,
    });
  });

  it("maps daily plan and task rows into DailyPlan", () => {
    const plan = mapDailyPlanRows(
      {
        id: "plan_seed_today",
        child_id: "child_seed",
        child_name: "小宇",
        target_date: "2026-06-19",
        total_minutes: 20,
        headline: "识字为主，数感巩固",
        reason_json: '["最近字形混淆需要先复习","今日可加入少量新知识"]',
      },
      [
        {
          id: "plan_task_literacy",
          task_id: "literacy-review",
          type: "literacy",
          title: "先复习林、木、森",
          description: "观察字形，理解意思，能读会用。",
          minutes: 6,
          progress: 6,
          total: 10,
          knowledge_ids_json: '["char-lin","char-mu"]',
          question_ids_json: '["q_char_lintone"]',
          status: "in_progress",
          sort_order: 1,
        },
      ],
    );

    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0]).toMatchObject({
      id: "literacy-review",
      type: "literacy",
      progress: 6,
      knowledgeIds: ["char-lin", "char-mu"],
      questionIds: ["q_char_lintone"],
      status: "in_progress",
    });
  });

  it("maps report rows with weakness evidence", () => {
    const report = mapReportRows(
      {
        id: "report_seed_today",
        child_id: "child_seed",
        report_date: "2026-06-19",
        summary: "小宇今天完成 4 个任务。",
        strengths_json: '["听音选字完成较快"]',
        tomorrow_suggestion: "明天建议先复习木字旁相关汉字。",
        stats_json: '{"totalMinutes":18,"completedTaskCount":4,"answeredCount":12,"correctRate":0.86,"hintCount":2}',
        generated_at: "2026-06-19T10:00:00.000Z",
      },
      [
        {
          id: "weak_seed_literacy",
          knowledge_id: "char-lin",
          title: "林 / 木",
          reason: "字形混淆",
          evidence_event_ids_json: '["evt_seed_answer_1"]',
        },
      ],
    );

    expect(report.weaknesses).toEqual([
      {
        knowledgeId: "char-lin",
        title: "林 / 木",
        reason: "字形混淆",
        evidenceEventIds: ["evt_seed_answer_1"],
      },
    ]);
    expect(report.stats.correctRate).toBe(0.86);
  });
});
