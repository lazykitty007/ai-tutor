export type KnowledgeType = "literacy" | "pinyin" | "math" | "focus";

export type KnowledgeNode = {
  id: string;
  title: string;
  type: KnowledgeType;
  pinyin?: string;
  meaning: string;
  relations: string[];
  difficulty: number;
};

export type MasteryRecord = {
  knowledgeId: string;
  masteryScore: number;
  exposureCount: number;
  correctCount: number;
  wrongCount: number;
  hintCount: number;
  lastPracticedDaysAgo: number;
  weaknessTags: string[];
};

export type LearningEvent = {
  knowledgeId: string;
  isCorrect: boolean;
  durationMs: number;
  hintCount: number;
  wrongStreak?: number;
};

export type DailyTask = {
  id: string;
  type: KnowledgeType;
  title: string;
  description: string;
  minutes: number;
  progress: number;
  total: number;
  knowledgeIds: string[];
};

export type DailyPlan = {
  childName: string;
  targetDate: string;
  totalMinutes: number;
  headline: string;
  reason: string[];
  tasks: DailyTask[];
};

export type ReportSummary = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tomorrowSuggestion: string;
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function updateMastery(record: MasteryRecord, event: LearningEvent): MasteryRecord {
  const speedBonus = event.durationMs <= 5000 ? 2 : event.durationMs > 15000 ? -2 : 0;
  const correctnessDelta = event.isCorrect ? 7 : -7;
  const hintPenalty = event.hintCount * 2;
  const repeatedWrongPenalty = event.wrongStreak && event.wrongStreak >= 2 ? 4 : 0;
  const nextScore = clampScore(
    record.masteryScore + correctnessDelta + speedBonus - hintPenalty - repeatedWrongPenalty,
  );

  const weaknessTags = new Set(record.weaknessTags);
  if (!event.isCorrect && event.wrongStreak && event.wrongStreak >= 2) {
    weaknessTags.add("需要多题型复习");
  }

  return {
    ...record,
    masteryScore: nextScore,
    exposureCount: record.exposureCount + 1,
    correctCount: record.correctCount + (event.isCorrect ? 1 : 0),
    wrongCount: record.wrongCount + (event.isCorrect ? 0 : 1),
    hintCount: record.hintCount + event.hintCount,
    lastPracticedDaysAgo: 0,
    weaknessTags: Array.from(weaknessTags),
  };
}

export function computeReviewPriority(record: MasteryRecord, parentBoost = 0): number {
  return Math.round(
    (100 - record.masteryScore) * 0.45 +
      record.lastPracticedDaysAgo * 4 +
      record.wrongCount * 8 +
      record.hintCount * 3 +
      parentBoost,
  );
}

export function pickReviewNodes(records: MasteryRecord[], limit = 4): string[] {
  return records
    .toSorted((a, b) => computeReviewPriority(b) - computeReviewPriority(a))
    .slice(0, limit)
    .map((record) => record.knowledgeId);
}

export function pickNewNodes(nodes: KnowledgeNode[], records: MasteryRecord[], limit = 2): string[] {
  const learned = new Set(records.map((record) => record.knowledgeId));
  const mastered = new Set(
    records.filter((record) => record.masteryScore >= 75).map((record) => record.knowledgeId),
  );

  return nodes
    .filter((node) => !learned.has(node.id))
    .map((node) => ({
      node,
      score:
        node.relations.filter((relation) => mastered.has(relation)).length * 10 -
        node.difficulty,
    }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ node }) => node.id);
}

export function generateDailyPlan(params: {
  childName: string;
  targetDate: string;
  dailyMinutes: number;
  records: MasteryRecord[];
  nodes: KnowledgeNode[];
  relaxedMode?: boolean;
}): DailyPlan {
  const reviewIds = pickReviewNodes(params.records, params.relaxedMode ? 5 : 4);
  const newIds = params.relaxedMode ? [] : pickNewNodes(params.nodes, params.records, 2);
  const reviewTitle = reviewIds.includes("char-lin") ? "先复习林、木、森" : "先复习旧知识";

  return {
    childName: params.childName,
    targetDate: params.targetDate,
    totalMinutes: params.dailyMinutes,
    headline: params.relaxedMode ? "轻松复习日" : "识字为主，数感巩固",
    reason: [
      "最近字形混淆需要先复习",
      "听音选字表现稳定，可以保持节奏",
      params.relaxedMode ? "家长已开启轻松模式" : "今日可加入少量新知识",
    ],
    tasks: [
      {
        id: "literacy-review",
        type: "literacy",
        title: reviewTitle,
        description: "观察字形，理解意思，能读会用。",
        minutes: params.relaxedMode ? 8 : 6,
        progress: 6,
        total: 10,
        knowledgeIds: reviewIds,
      },
      {
        id: "pinyin-speaking",
        type: "pinyin",
        title: "拼音与听说",
        description: "听辨 l / m，练发音，能听会说。",
        minutes: 4,
        progress: 4,
        total: 10,
        knowledgeIds: ["pinyin-l", "pinyin-m"],
      },
      {
        id: "math-sense",
        type: "math",
        title: "数感小游戏",
        description: "理解数量，比较多少，解决问题。",
        minutes: params.relaxedMode ? 5 : 4,
        progress: 3,
        total: 10,
        knowledgeIds: ["math-compare"],
      },
      {
        id: "new-words",
        type: "literacy",
        title: params.relaxedMode ? "今日回顾" : "新字学习",
        description: params.relaxedMode ? "用轻松题型巩固今天的字。" : "学习 1-2 个和木字旁相关的新字。",
        minutes: params.relaxedMode ? 3 : 6,
        progress: params.relaxedMode ? 5 : 0,
        total: 10,
        knowledgeIds: newIds,
      },
    ],
  };
}

export function generateReport(plan: DailyPlan, records: MasteryRecord[]): ReportSummary {
  const weak = records
    .filter((record) => record.masteryScore < 70 || record.wrongCount > 1)
    .toSorted((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 2);

  return {
    summary: `${plan.childName}今天完成 ${plan.tasks.length} 个任务，识字表现稳定。`,
    strengths: ["听音选字完成较快", "能坚持完成 18 分钟学习", "数感比较题正确率稳定"],
    weaknesses: weak.map((record) => `${record.knowledgeId} 需要继续复习`),
    tomorrowSuggestion: "明天建议先复习木字旁相关汉字，再安排少量新字。",
  };
}
