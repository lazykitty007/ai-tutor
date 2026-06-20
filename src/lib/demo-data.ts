import { generateDailyPlan, generateReport, type DailyTask, type KnowledgeNode, type MasteryRecord } from "./learning-engine";

export const childProfile = {
  name: "小宇",
  ageBand: "5-6 岁",
  stage: "幼小衔接",
  dailyMinutes: 20,
  streakDays: 5,
};

export const knowledgeNodes: KnowledgeNode[] = [
  { id: "char-mu", title: "木", type: "literacy", pinyin: "mù", meaning: "树木", relations: [], difficulty: 1 },
  { id: "char-lin", title: "林", type: "literacy", pinyin: "lín", meaning: "树林", relations: ["char-mu"], difficulty: 2 },
  { id: "char-sen", title: "森", type: "literacy", pinyin: "sēn", meaning: "森林", relations: ["char-mu", "char-lin"], difficulty: 3 },
  { id: "char-xiu", title: "休", type: "literacy", pinyin: "xiū", meaning: "休息", relations: ["char-mu"], difficulty: 4 },
  { id: "char-ming", title: "明", type: "literacy", pinyin: "míng", meaning: "明亮", relations: [], difficulty: 3 },
  { id: "pinyin-l", title: "l", type: "pinyin", meaning: "声母 l", relations: [], difficulty: 2 },
  { id: "pinyin-m", title: "m", type: "pinyin", meaning: "声母 m", relations: [], difficulty: 2 },
  { id: "math-compare", title: "数量比较", type: "math", meaning: "比较多少", relations: [], difficulty: 2 },
];

export const masteryRecords: MasteryRecord[] = [
  {
    knowledgeId: "char-lin",
    masteryScore: 64,
    exposureCount: 8,
    correctCount: 5,
    wrongCount: 3,
    hintCount: 2,
    lastPracticedDaysAgo: 0,
    weaknessTags: ["字形混淆"],
  },
  {
    knowledgeId: "char-mu",
    masteryScore: 82,
    exposureCount: 12,
    correctCount: 10,
    wrongCount: 2,
    hintCount: 1,
    lastPracticedDaysAgo: 1,
    weaknessTags: [],
  },
  {
    knowledgeId: "char-sen",
    masteryScore: 58,
    exposureCount: 5,
    correctCount: 3,
    wrongCount: 2,
    hintCount: 3,
    lastPracticedDaysAgo: 3,
    weaknessTags: ["结构复杂"],
  },
  {
    knowledgeId: "pinyin-l",
    masteryScore: 70,
    exposureCount: 6,
    correctCount: 4,
    wrongCount: 2,
    hintCount: 1,
    lastPracticedDaysAgo: 2,
    weaknessTags: ["听辨稍慢"],
  },
  {
    knowledgeId: "math-compare",
    masteryScore: 76,
    exposureCount: 10,
    correctCount: 8,
    wrongCount: 2,
    hintCount: 0,
    lastPracticedDaysAgo: 1,
    weaknessTags: [],
  },
];

export const todayPlan = generateDailyPlan({
  childName: childProfile.name,
  targetDate: "2026-06-19",
  dailyMinutes: childProfile.dailyMinutes,
  records: masteryRecords,
  nodes: knowledgeNodes,
});

export const relaxedPlan = generateDailyPlan({
  childName: childProfile.name,
  targetDate: "2026-06-20",
  dailyMinutes: childProfile.dailyMinutes,
  records: masteryRecords,
  nodes: knowledgeNodes,
  relaxedMode: true,
});

export const todayReport = generateReport(todayPlan, masteryRecords);

export const assessmentChoices = [
  { char: "木", label: "树木", correct: false },
  { char: "林", label: "树林", correct: true },
  { char: "森", label: "森林", correct: false },
];

export const taskMap: Record<string, DailyTask> = {
  literacy: todayPlan.tasks[0],
  pinyin: todayPlan.tasks[1],
  math: todayPlan.tasks[2],
};
