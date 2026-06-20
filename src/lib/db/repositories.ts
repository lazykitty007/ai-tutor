import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { withConnection } from "./client";
import {
  updateMastery,
  type DailyPlan,
  type DailyTask,
  type KnowledgeNode,
  type KnowledgeType,
  type MasteryRecord,
  type ReportSummary,
} from "@/lib/learning-engine";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ChildProfile = {
  id: string;
  name: string;
  ageBand: string;
  stage: string;
  dailyMinutes: number;
  goals: string[];
  isActive: boolean;
};

export type PlanTaskStatus = "not_started" | "in_progress" | "completed" | "skipped";

export type DbDailyTask = DailyTask & {
  questionIds: string[];
  status: PlanTaskStatus;
  sortOrder: number;
};

export type DbDailyPlan = Omit<DailyPlan, "tasks"> & {
  id: string;
  childId: string;
  tasks: DbDailyTask[];
};

export type DbReportSummary = Omit<ReportSummary, "weaknesses"> & {
  id: string;
  childId: string;
  reportDate: string;
  stats: {
    totalMinutes: number;
    completedTaskCount: number;
    answeredCount: number;
    correctRate: number;
    hintCount: number;
  };
  generatedAt: string;
  weaknesses: Array<{
    knowledgeId: string;
    title: string;
    reason: string;
    evidenceEventIds: string[];
  }>;
};

type ChildProfileRow = {
  id: string;
  nickname: string;
  age_band: string;
  stage: string;
  daily_minutes: number;
  goals_json: JsonValue;
  is_active: boolean | number;
};

type DailyPlanRow = {
  id: string;
  child_id: string;
  child_name: string;
  target_date: string | Date;
  total_minutes: number;
  headline: string;
  reason_json: JsonValue;
};

type DailyPlanTaskRow = {
  id: string;
  task_id: string;
  type: KnowledgeType;
  title: string;
  description: string;
  minutes: number;
  progress: number;
  total: number;
  knowledge_ids_json: JsonValue;
  question_ids_json: JsonValue;
  status: PlanTaskStatus;
  sort_order: number;
};

type ReportRow = {
  id: string;
  child_id: string;
  report_date: string | Date;
  summary: string;
  strengths_json: JsonValue;
  tomorrow_suggestion: string;
  stats_json: JsonValue;
  generated_at: string | Date;
};

type ReportWeaknessRow = {
  id: string;
  knowledge_id: string;
  title: string;
  reason: string;
  evidence_event_ids_json: JsonValue;
};

type MasteryRecordRow = {
  knowledge_id: string;
  mastery_score: number;
  exposure_count: number;
  correct_count: number;
  wrong_count: number;
  hint_count: number;
  last_practiced_at: string | Date | null;
  weakness_tags_json: JsonValue;
};

type KnowledgeNodeRow = {
  id: string;
  title: string;
  type: KnowledgeType;
  pinyin: string | null;
  meaning: string;
  difficulty: number;
  relations_json: JsonValue;
};

type MasteryStorageRow = MasteryRecordRow & {
  id: string;
  type: KnowledgeType;
};

export type LearningEventInput = {
  clientEventId: string;
  childId: string;
  sessionId?: string;
  planId?: string;
  taskId?: string;
  questionId?: string;
  eventType: string;
  knowledgeIds?: string[];
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export type LearningEventWriteResult = {
  clientEventId: string;
  status: "accepted";
  duplicate: boolean;
};

export type CreateChildProfileInput = {
  nickname: string;
  ageBand: string;
  stage: string;
  dailyMinutes: number;
  goals: string[];
};

function parseJson<T>(value: JsonValue | undefined, fallback: T): T {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toDateString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function daysSince(value: string | Date | null): number {
  if (!value) {
    return 999;
  }

  const practiced = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - practiced.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function numberFromPayload(payload: Record<string, unknown>, key: string, fallback = 0): number {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanFromPayload(payload: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = payload[key];
  return typeof value === "boolean" ? value : fallback;
}

function toMysqlDateTime(value?: string): string {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toISOString().slice(0, 23).replace("T", " ");
}

async function ensureSession(connection: PoolConnection, event: LearningEventInput): Promise<string> {
  const sessionId = event.sessionId || randomUUID();
  const [existing] = await connection.query<Array<{ id: string } & RowDataPacket>>(
    "SELECT id FROM learning_sessions WHERE id = ? LIMIT 1",
    [sessionId],
  );

  if (existing[0]) {
    return sessionId;
  }

  await connection.query(
    `INSERT INTO learning_sessions
       (id, child_id, mode, task_id, plan_id, subject, started_at, status, device_info)
     VALUES (?, ?, ?, ?, ?, NULL, ?, 'active', JSON_OBJECT('source', 'api'))`,
    [
      sessionId,
      event.childId,
      event.eventType === "session_started" ? "assessment" : "daily_task",
      event.taskId || null,
      event.planId || null,
      toMysqlDateTime(event.createdAt),
    ],
  );

  return sessionId;
}

async function insertQuestionAttempt(
  connection: PoolConnection,
  event: LearningEventInput,
  sessionId: string,
): Promise<void> {
  if (event.eventType !== "item_answered" || !event.questionId || !event.taskId) {
    return;
  }

  const payload = event.payload || {};
  const [countRows] = await connection.query<Array<{ attempt_count: number } & RowDataPacket>>(
    `SELECT COUNT(*) AS attempt_count
     FROM question_attempts
     WHERE child_id = ? AND question_id = ?`,
    [event.childId, event.questionId],
  );

  await connection.query(
    `INSERT INTO question_attempts
       (id, child_id, session_id, task_id, question_id, knowledge_ids, selected_answer,
        correct_answer, is_correct, duration_ms, hint_count, attempt_index, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      event.childId,
      sessionId,
      event.taskId,
      event.questionId,
      json(event.knowledgeIds || []),
      json(payload.selectedAnswer ?? null),
      json(payload.correctAnswer ?? null),
      booleanFromPayload(payload, "isCorrect"),
      numberFromPayload(payload, "durationMs"),
      numberFromPayload(payload, "hintCount"),
      (countRows[0]?.attempt_count || 0) + 1,
      toMysqlDateTime(event.createdAt),
    ],
  );
}

async function upsertMasteryForEvent(
  connection: PoolConnection,
  event: LearningEventInput,
  eventId: string,
): Promise<void> {
  if (event.eventType !== "item_answered" || !event.knowledgeIds?.length) {
    return;
  }

  const payload = event.payload || {};

  for (const knowledgeId of event.knowledgeIds) {
    const [rows] = await connection.query<Array<MasteryStorageRow & RowDataPacket>>(
      `SELECT id, knowledge_id, type, mastery_score, exposure_count, correct_count, wrong_count,
              hint_count, last_practiced_at, JSON_EXTRACT(weakness_tags, '$') AS weakness_tags_json
       FROM mastery_records
       WHERE child_id = ? AND knowledge_id = ?
       LIMIT 1`,
      [event.childId, knowledgeId],
    );
    const current = rows[0];
    const [nodeRows] = await connection.query<Array<{ type: KnowledgeType } & RowDataPacket>>(
      "SELECT type FROM knowledge_nodes WHERE id = ? LIMIT 1",
      [knowledgeId],
    );
    const type = current?.type || nodeRows[0]?.type || "focus";
    const baseRecord: MasteryRecord = current
      ? mapMasteryRecordRow(current)
      : {
          knowledgeId,
          masteryScore: 50,
          exposureCount: 0,
          correctCount: 0,
          wrongCount: 0,
          hintCount: 0,
          lastPracticedDaysAgo: 999,
          weaknessTags: [],
        };
    const next = updateMastery(baseRecord, {
      knowledgeId,
      isCorrect: booleanFromPayload(payload, "isCorrect"),
      durationMs: numberFromPayload(payload, "durationMs", 10_000),
      hintCount: numberFromPayload(payload, "hintCount"),
      wrongStreak: numberFromPayload(payload, "wrongStreak"),
    });

    await connection.query(
      `INSERT INTO mastery_records
         (id, child_id, knowledge_id, type, mastery_score, exposure_count, correct_count,
          wrong_count, hint_count, last_practiced_at, weakness_tags, updated_from_event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         mastery_score = VALUES(mastery_score),
         exposure_count = VALUES(exposure_count),
         correct_count = VALUES(correct_count),
         wrong_count = VALUES(wrong_count),
         hint_count = VALUES(hint_count),
         last_practiced_at = VALUES(last_practiced_at),
         weakness_tags = VALUES(weakness_tags),
         updated_from_event_id = VALUES(updated_from_event_id)`,
      [
        current?.id || randomUUID(),
        event.childId,
        knowledgeId,
        type,
        next.masteryScore,
        next.exposureCount,
        next.correctCount,
        next.wrongCount,
        next.hintCount,
        toMysqlDateTime(event.createdAt),
        json(next.weaknessTags),
        eventId,
      ],
    );
  }
}

async function updateTaskProgress(connection: PoolConnection, event: LearningEventInput): Promise<void> {
  if (!event.planId || !event.taskId) {
    return;
  }

  if (event.eventType === "task_completed") {
    await connection.query(
      `UPDATE daily_plan_tasks
       SET status = 'completed', progress = total
       WHERE plan_id = ? AND task_id = ?`,
      [event.planId, event.taskId],
    );
    return;
  }

  if (event.eventType === "item_answered") {
    await connection.query(
      `UPDATE daily_plan_tasks
       SET status = 'in_progress', progress = LEAST(total, progress + 1)
       WHERE plan_id = ? AND task_id = ?`,
      [event.planId, event.taskId],
    );
  }
}

export function mapChildProfileRow(row: ChildProfileRow): ChildProfile {
  return {
    id: row.id,
    name: row.nickname,
    ageBand: row.age_band,
    stage: row.stage,
    dailyMinutes: row.daily_minutes,
    goals: parseJson<string[]>(row.goals_json, []),
    isActive: Boolean(row.is_active),
  };
}

export function mapDailyPlanRows(planRow: DailyPlanRow, taskRows: DailyPlanTaskRow[]): DbDailyPlan {
  return {
    id: planRow.id,
    childId: planRow.child_id,
    childName: planRow.child_name,
    targetDate: toDateString(planRow.target_date),
    totalMinutes: planRow.total_minutes,
    headline: planRow.headline,
    reason: parseJson<string[]>(planRow.reason_json, []),
    tasks: taskRows.map((row) => ({
      id: row.task_id,
      type: row.type,
      title: row.title,
      description: row.description,
      minutes: row.minutes,
      progress: row.progress,
      total: row.total,
      knowledgeIds: parseJson<string[]>(row.knowledge_ids_json, []),
      questionIds: parseJson<string[]>(row.question_ids_json, []),
      status: row.status,
      sortOrder: row.sort_order,
    })),
  };
}

export function mapReportRows(reportRow: ReportRow, weaknessRows: ReportWeaknessRow[]): DbReportSummary {
  return {
    id: reportRow.id,
    childId: reportRow.child_id,
    reportDate: toDateString(reportRow.report_date),
    summary: reportRow.summary,
    strengths: parseJson<string[]>(reportRow.strengths_json, []),
    tomorrowSuggestion: reportRow.tomorrow_suggestion,
    stats: parseJson<DbReportSummary["stats"]>(reportRow.stats_json, {
      totalMinutes: 0,
      completedTaskCount: 0,
      answeredCount: 0,
      correctRate: 0,
      hintCount: 0,
    }),
    generatedAt: toIsoString(reportRow.generated_at),
    weaknesses: weaknessRows.map((row) => ({
      knowledgeId: row.knowledge_id,
      title: row.title,
      reason: row.reason,
      evidenceEventIds: parseJson<string[]>(row.evidence_event_ids_json, []),
    })),
  };
}

export function mapMasteryRecordRow(row: MasteryRecordRow): MasteryRecord {
  return {
    knowledgeId: row.knowledge_id,
    masteryScore: row.mastery_score,
    exposureCount: row.exposure_count,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    hintCount: row.hint_count,
    lastPracticedDaysAgo: daysSince(row.last_practiced_at),
    weaknessTags: parseJson<string[]>(row.weakness_tags_json, []),
  };
}

export function mapKnowledgeNodeRow(row: KnowledgeNodeRow): KnowledgeNode {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    pinyin: row.pinyin || undefined,
    meaning: row.meaning,
    relations: parseJson<string[]>(row.relations_json, []),
    difficulty: row.difficulty,
  };
}

export async function getActiveChildProfile(userId?: string): Promise<ChildProfile | null> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<Array<ChildProfileRow & RowDataPacket>>(
      `SELECT id, nickname, age_band, stage, daily_minutes, JSON_EXTRACT(goals, '$') AS goals_json, is_active
       FROM child_profiles
       WHERE is_active = TRUE AND deleted_at IS NULL
         AND (? IS NULL OR user_id = ?)
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId || null, userId || null],
    );

    return rows[0] ? mapChildProfileRow(rows[0]) : null;
  });
}

export async function getDailyPlanByDate(targetDate: string, userId?: string): Promise<DbDailyPlan | null> {
  return withConnection(async (connection) => {
    const [planRows] = await connection.query<Array<DailyPlanRow & RowDataPacket>>(
      `SELECT dp.id, dp.child_id, cp.nickname AS child_name, dp.target_date, dp.total_minutes,
              dp.headline, JSON_EXTRACT(dp.reason, '$') AS reason_json
       FROM daily_plans dp
       INNER JOIN child_profiles cp ON cp.id = dp.child_id
       WHERE dp.target_date = ?
         AND cp.is_active = TRUE
         AND cp.deleted_at IS NULL
         AND (? IS NULL OR cp.user_id = ?)
       LIMIT 1`,
      [targetDate, userId || null, userId || null],
    );

    const planRow = planRows[0];
    if (!planRow) {
      return null;
    }

    const [taskRows] = await connection.query<Array<DailyPlanTaskRow & RowDataPacket>>(
      `SELECT id, task_id, type, title, description, minutes, progress, total,
              JSON_EXTRACT(knowledge_ids, '$') AS knowledge_ids_json,
              JSON_EXTRACT(question_ids, '$') AS question_ids_json,
              status, sort_order
       FROM daily_plan_tasks
       WHERE plan_id = ?
       ORDER BY sort_order ASC`,
      [planRow.id],
    );

    return mapDailyPlanRows(planRow, taskRows);
  });
}

export async function getTaskByRouteId(taskRouteId: string, targetDate: string, userId?: string): Promise<DbDailyTask | null> {
  const plan = await getDailyPlanByDate(targetDate, userId);
  if (!plan) {
    return null;
  }

  return (
    plan.tasks.find((task) => task.type === taskRouteId || task.id === taskRouteId) ||
    null
  );
}

export async function getReportByDate(reportDate: string, userId?: string): Promise<DbReportSummary | null> {
  return withConnection(async (connection) => {
    const [reportRows] = await connection.query<Array<ReportRow & RowDataPacket>>(
      `SELECT r.id, r.child_id, r.report_date, r.summary, JSON_EXTRACT(r.strengths, '$') AS strengths_json,
              r.tomorrow_suggestion, JSON_EXTRACT(r.stats, '$') AS stats_json, r.generated_at
       FROM reports r
       INNER JOIN child_profiles cp ON cp.id = r.child_id
       WHERE r.report_date = ?
         AND (? IS NULL OR cp.user_id = ?)
       LIMIT 1`,
      [reportDate, userId || null, userId || null],
    );

    const reportRow = reportRows[0];
    if (!reportRow) {
      return null;
    }

    const [weaknessRows] = await connection.query<Array<ReportWeaknessRow & RowDataPacket>>(
      `SELECT id, knowledge_id, title, reason, JSON_EXTRACT(evidence_event_ids, '$') AS evidence_event_ids_json
       FROM report_weaknesses
       WHERE report_id = ?
       ORDER BY id ASC`,
      [reportRow.id],
    );

    return mapReportRows(reportRow, weaknessRows);
  });
}

export async function getMasteryRecordsForActiveChild(userId?: string): Promise<MasteryRecord[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<Array<MasteryRecordRow & RowDataPacket>>(
      `SELECT mr.knowledge_id, mr.mastery_score, mr.exposure_count, mr.correct_count,
              mr.wrong_count, mr.hint_count, mr.last_practiced_at,
              JSON_EXTRACT(mr.weakness_tags, '$') AS weakness_tags_json
       FROM mastery_records mr
       INNER JOIN child_profiles cp ON cp.id = mr.child_id
       WHERE cp.is_active = TRUE AND cp.deleted_at IS NULL
         AND (? IS NULL OR cp.user_id = ?)
       ORDER BY mr.mastery_score ASC`,
      [userId || null, userId || null],
    );

    return rows.map(mapMasteryRecordRow);
  });
}

export async function getKnowledgeNodes(): Promise<KnowledgeNode[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<Array<KnowledgeNodeRow & RowDataPacket>>(
      `SELECT kn.id, kn.title, kn.type, kn.pinyin, kn.meaning, kn.difficulty,
              COALESCE(JSON_ARRAYAGG(kr.to_knowledge_id), JSON_ARRAY()) AS relations_json
       FROM knowledge_nodes kn
       LEFT JOIN knowledge_relations kr ON kr.from_knowledge_id = kn.id
       WHERE kn.enabled = TRUE
       GROUP BY kn.id, kn.title, kn.type, kn.pinyin, kn.meaning, kn.difficulty
       ORDER BY kn.difficulty ASC, kn.id ASC`,
    );

    return rows.map(mapKnowledgeNodeRow);
  });
}

async function insertStarterLearningData(connection: PoolConnection, childId: string, childName: string, dailyMinutes: number): Promise<void> {
  const planId = randomUUID();
  const reportId = randomUUID();

  await connection.query(
    `INSERT INTO mastery_records
       (id, child_id, knowledge_id, type, mastery_score, exposure_count, correct_count,
        wrong_count, hint_count, last_practiced_at, weakness_tags, updated_from_event_id)
     VALUES
       (?, ?, 'char-lin', 'literacy', 64, 8, 5, 3, 2, UTC_TIMESTAMP(3), JSON_ARRAY('字形混淆'), NULL),
       (?, ?, 'char-mu', 'literacy', 82, 12, 10, 2, 1, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY), JSON_ARRAY(), NULL),
       (?, ?, 'char-sen', 'literacy', 58, 5, 3, 2, 3, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 3 DAY), JSON_ARRAY('结构复杂'), NULL),
       (?, ?, 'pinyin-l', 'pinyin', 70, 6, 4, 2, 1, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 2 DAY), JSON_ARRAY('听辨稍慢'), NULL),
       (?, ?, 'math-compare', 'math', 76, 10, 8, 2, 0, UTC_TIMESTAMP(3), JSON_ARRAY(), NULL)`,
    [
      randomUUID(),
      childId,
      randomUUID(),
      childId,
      randomUUID(),
      childId,
      randomUUID(),
      childId,
      randomUUID(),
      childId,
    ],
  );

  await connection.query(
    `INSERT INTO daily_plans
       (id, child_id, target_date, total_minutes, headline, reason, source, generated_from)
     VALUES (?, ?, CURDATE(), ?, '识字为主，数感巩固',
       JSON_ARRAY('最近字形混淆需要先复习', '听音选字表现稳定，可以保持节奏', '今日可加入少量新知识'),
       'onboarding', JSON_OBJECT('source', 'starter'))`,
    [planId, childId, dailyMinutes],
  );
  await connection.query(
    `INSERT INTO daily_plan_tasks
       (id, plan_id, task_id, type, title, description, minutes, progress, total,
        knowledge_ids, question_ids, status, sort_order)
     VALUES
       (?, ?, 'literacy-review', 'literacy', '先复习林、木、森', '观察字形，理解意思，能读会用。', 6, 6, 10,
        JSON_ARRAY('char-lin', 'char-mu', 'char-sen'), JSON_ARRAY('q_char_lintone', 'q_char_mu_meaning', 'q_char_sen_build'), 'in_progress', 1),
       (?, ?, 'pinyin-speaking', 'pinyin', '拼音与听说', '听辨 l / m，练发音，能听会说。', 4, 4, 10,
        JSON_ARRAY('pinyin-l', 'pinyin-m'), JSON_ARRAY('q_pinyin_l_sound', 'q_pinyin_m_sound'), 'in_progress', 2),
       (?, ?, 'math-sense', 'math', '数感小游戏', '理解数量，比较多少，解决问题。', 4, 3, 10,
        JSON_ARRAY('math-compare', 'math-counting'), JSON_ARRAY('q_math_compare_7_5', 'q_math_count_6', 'q_math_ten_frame_8'), 'in_progress', 3),
       (?, ?, 'new-words', 'literacy', '新字学习', '学习 1-2 个和木字旁相关的新字。', 6, 0, 10,
        JSON_ARRAY('char-xiu'), JSON_ARRAY('q_char_sen_build'), 'not_started', 4)`,
    [randomUUID(), planId, randomUUID(), planId, randomUUID(), planId, randomUUID(), planId],
  );
  await connection.query(
    `INSERT INTO reports
       (id, child_id, report_date, summary, strengths, tomorrow_suggestion, stats, generated_from, generated_at)
     VALUES (?, ?, CURDATE(), ?, JSON_ARRAY('听音选字完成较快', '能坚持完成 18 分钟学习', '数感比较题正确率稳定'),
       '明天建议先复习木字旁相关汉字，再安排少量新字。',
       JSON_OBJECT('totalMinutes', 18, 'completedTaskCount', 4, 'answeredCount', 12, 'correctRate', 0.86, 'hintCount', 2),
       JSON_OBJECT('source', 'starter', 'planId', ?), UTC_TIMESTAMP(3))`,
    [reportId, childId, `${childName}今天完成 4 个任务，识字表现稳定。`, planId],
  );
  await connection.query(
    `INSERT INTO report_weaknesses
       (id, report_id, knowledge_id, title, reason, evidence_event_ids)
     VALUES
       (?, ?, 'char-lin', '林 / 木', '字形混淆，需要继续通过部件观察巩固。', JSON_ARRAY()),
       (?, ?, 'char-sen', '森的结构', '三个木的结构复杂，容易和林混淆。', JSON_ARRAY())`,
    [randomUUID(), reportId, randomUUID(), reportId],
  );
}

export async function createChildProfile(userId: string, input: CreateChildProfileInput): Promise<ChildProfile> {
  return withConnection(async (connection) => {
    await connection.beginTransaction();

    try {
      const childId = randomUUID();

      await connection.query(
        `INSERT INTO child_profiles
           (id, user_id, nickname, age_band, stage, daily_minutes, goals, baseline, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, JSON_OBJECT('source', 'onboarding'), TRUE)`,
        [
          childId,
          userId,
          input.nickname,
          input.ageBand,
          input.stage,
          input.dailyMinutes,
          json(input.goals),
        ],
      );
      await connection.query(
        `INSERT INTO parent_preferences
           (child_id, gate_type, relaxed_mode_default, report_push_enabled, allow_new_knowledge, max_daily_minutes)
         VALUES (?, 'hold_button', FALSE, TRUE, TRUE, ?)`,
        [childId, Math.max(input.dailyMinutes, 20)],
      );
      await insertStarterLearningData(connection, childId, input.nickname, input.dailyMinutes);
      await connection.commit();

      return {
        id: childId,
        name: input.nickname,
        ageBand: input.ageBand,
        stage: input.stage,
        dailyMinutes: input.dailyMinutes,
        goals: input.goals,
        isActive: true,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function recordLearningEvents(events: LearningEventInput[], userId?: string): Promise<LearningEventWriteResult[]> {
  return withConnection(async (connection) => {
    await connection.beginTransaction();

    try {
      const results: LearningEventWriteResult[] = [];

      for (const event of events) {
        if (userId) {
          const [childRows] = await connection.query<Array<{ id: string } & RowDataPacket>>(
            "SELECT id FROM child_profiles WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1",
            [event.childId, userId],
          );

          if (!childRows[0]) {
            throw new Error("CHILD_ACCESS_DENIED");
          }
        }

        const [existing] = await connection.query<Array<{ id: string } & RowDataPacket>>(
          "SELECT id FROM learning_events WHERE client_event_id = ? LIMIT 1",
          [event.clientEventId],
        );

        if (existing[0]) {
          results.push({
            clientEventId: event.clientEventId,
            status: "accepted",
            duplicate: true,
          });
          continue;
        }

        const sessionId = await ensureSession(connection, event);
        const eventId = randomUUID();

        await connection.query(
          `INSERT INTO learning_events
             (id, client_event_id, child_id, session_id, plan_id, task_id, question_id,
              event_type, knowledge_ids, payload, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            eventId,
            event.clientEventId,
            event.childId,
            sessionId,
            event.planId || null,
            event.taskId || null,
            event.questionId || null,
            event.eventType,
            json(event.knowledgeIds || []),
            json(event.payload || {}),
            toMysqlDateTime(event.createdAt),
          ],
        );

        await insertQuestionAttempt(connection, event, sessionId);
        await upsertMasteryForEvent(connection, event, eventId);
        await updateTaskProgress(connection, event);

        results.push({
          clientEventId: event.clientEventId,
          status: "accepted",
          duplicate: false,
        });
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}
