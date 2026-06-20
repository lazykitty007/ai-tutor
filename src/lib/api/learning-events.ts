import type { LearningEventInput } from "@/lib/db/repositories";

const acceptedTypes = new Set([
  "session_started",
  "task_started",
  "item_presented",
  "item_answered",
  "hint_shown",
  "task_completed",
  "task_skipped",
]);

type RawLearningEvent = {
  clientEventId?: unknown;
  childId?: unknown;
  sessionId?: unknown;
  planId?: unknown;
  taskId?: unknown;
  questionId?: unknown;
  eventType?: unknown;
  knowledgeIds?: unknown;
  payload?: unknown;
  createdAt?: unknown;
};

export type LearningEventsParseResult = {
  accepted: LearningEventInput[];
  rejected: number;
};

export function parseLearningEventsBody(body: unknown): LearningEventsParseResult | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { events?: unknown }).events)) {
    return null;
  }

  const accepted: LearningEventInput[] = [];
  let rejected = 0;

  for (const raw of (body as { events: RawLearningEvent[] }).events) {
    const event = normalizeLearningEvent(raw);
    if (event) {
      accepted.push(event);
    } else {
      rejected += 1;
    }
  }

  return { accepted, rejected };
}

export function todayDateKey(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeLearningEvent(raw: RawLearningEvent): LearningEventInput | null {
  if (
    typeof raw.clientEventId !== "string" ||
    typeof raw.childId !== "string" ||
    typeof raw.eventType !== "string" ||
    !acceptedTypes.has(raw.eventType)
  ) {
    return null;
  }

  return {
    clientEventId: raw.clientEventId,
    childId: raw.childId,
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId : undefined,
    planId: typeof raw.planId === "string" ? raw.planId : undefined,
    taskId: typeof raw.taskId === "string" ? raw.taskId : undefined,
    questionId: typeof raw.questionId === "string" ? raw.questionId : undefined,
    eventType: raw.eventType,
    knowledgeIds: Array.isArray(raw.knowledgeIds)
      ? raw.knowledgeIds.filter((value): value is string => typeof value === "string")
      : [],
    payload:
      raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)
        ? (raw.payload as Record<string, unknown>)
        : {},
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}
