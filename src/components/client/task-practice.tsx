"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppButton, CircleIcon, ProgressBars } from "@/components/primitives";
import type { DailyTask } from "@/lib/learning-engine";

const NumberSenseGame = dynamic(
  () => import("@/components/client/number-sense-game").then((mod) => mod.NumberSenseGame),
  {
    loading: () => (
      <section className="number-sense-loading" aria-label="数感游戏加载中">
        <p>数感操作台正在准备...</p>
      </section>
    ),
    ssr: false,
  },
);

const taskContent = {
  literacy: {
    label: "今天的新字",
    title: "认识 “林”",
    prompt: "选出和 “林” 结构相同的字",
    lead: "两个“木”站在一起，就像一片小树林。",
    choices: ["从", "双", "日"],
    answer: "双",
    hint: "看看这个字是不是由两个一样的部分组成。",
    symbol: "林",
  },
  pinyin: {
    label: "声母韵母",
    title: "听音，练发音",
    prompt: "请跟读：aoe",
    lead: "今天练习 a、o、e 的听辨和跟读，不给孩子制造分数压力。",
    choices: ["a", "o", "e"],
    answer: "a",
    hint: "嘴巴张大，轻轻发出 a 的声音。",
    symbol: "a",
  },
  math: {
    label: "数量比较",
    title: "哪一边更多？",
    prompt: "先数一数，再选择答案。",
    lead: "左边有 7 个圆片，右边有 5 个圆片。",
    choices: ["左边更多", "右边更多", "一样多"],
    answer: "左边更多",
    hint: "一个一个点数，7 比 5 多。",
    symbol: "7",
  },
} as const;

type TaskPracticeProps = {
  task: DailyTask;
  childId?: string;
  planId?: string;
};

export function TaskPractice({ task, childId, planId }: TaskPracticeProps) {
  const router = useRouter();
  const contentKey = task.type === "focus" ? "math" : task.type;
  const content = taskContent[contentKey];
  const [selected, setSelected] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(task.progress);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingAnswerEventId, setPendingAnswerEventId] = useState<string | null>(null);
  const isCorrect = selected === content.answer;

  const progress = useMemo(() => Math.min(task.total, correctCount + (isCorrect ? 1 : 0)), [correctCount, isCorrect, task.total]);
  const questionIds = (task as DailyTask & { questionIds?: string[] }).questionIds || [];
  const shouldPersistEvents = Boolean(childId && planId);

  async function sendLearningEvent(eventType: string, payload: Record<string, unknown>, clientEventId = crypto.randomUUID()) {
    if (!childId || !planId) {
      return true;
    }

    const response = await fetch("/api/learning/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        events: [
          {
            clientEventId,
            childId,
            planId,
            taskId: task.id,
            questionId: questionIds[0],
            eventType,
            knowledgeIds: task.knowledgeIds,
            payload,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
    return response.ok;
  }

  async function persistSelectedAnswer(): Promise<boolean> {
    if (!selected) {
      return false;
    }

    setSubmitting(true);
    setSaveError(null);
    const clientEventId = pendingAnswerEventId || crypto.randomUUID();
    setPendingAnswerEventId(clientEventId);

    const saved = await sendLearningEvent(
      "item_answered",
      {
        selectedAnswer: selected,
        correctAnswer: content.answer,
        isCorrect,
        durationMs: 8200,
        hintCount,
        wrongStreak: isCorrect ? 0 : 1,
        inputMode: "tap",
      },
      clientEventId,
    ).catch(() => false);

    setSubmitting(false);
    if (!saved) {
      setSaveError("学习记录没有保存成功，请检查网络后重试。");
      return false;
    }

    setPendingAnswerEventId(null);
    return true;
  }

  function handleHint() {
    const nextHintCount = hintCount + 1;
    setHintCount(nextHintCount);
    void sendLearningEvent("hint_shown", {
      hintLevel: nextHintCount,
      hintTextKey: `${task.id}-hint-${nextHintCount}`,
      questionId: questionIds[0],
    }).catch(() => undefined);
  }

  async function handleSubmitAnswer() {
    if (!selected || submitting) {
      return;
    }
    if (shouldPersistEvents) {
      const saved = await persistSelectedAnswer();
      if (!saved) {
        return;
      }
    }

    if (isCorrect) {
      if (progress >= task.total - 1) {
        if (shouldPersistEvents) {
          await sendLearningEvent("task_completed", {
            progress: task.total,
            total: task.total,
          }).catch(() => undefined);
        }
        router.push("/learn/complete");
        return;
      }
      setCorrectCount((value) => Math.min(task.total, value + 1));
      setSelected(null);
      return;
    }
    setHintCount((value) => value + 1);
  }

  return (
    <div className="task-practice">
      <div className="task-head">
        <div>
          <p className="section-label">{content.label}</p>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>
        <ProgressBars value={progress} total={task.total} />
      </div>

      {contentKey === "math" ? (
        <NumberSenseGame
          choices={content.choices}
          hint={content.hint}
          hintCount={hintCount}
          isCorrect={isCorrect}
          onHint={handleHint}
          onSelect={setSelected}
          onSubmit={handleSubmitAnswer}
          prompt={content.prompt}
          saveError={saveError}
          selected={selected}
          submitting={submitting}
          task={task}
        />
      ) : (
        <div className="task-grid">
        <section className="char-stage" aria-label="当前知识点">
          <strong>{content.symbol}</strong>
          <p>{task.title} · {task.minutes} 分钟</p>
        </section>

        <section className="practice-panel">
          <h2>{content.prompt}</h2>
          <div className="mini-choice-grid">
            {content.choices.map((choice) => (
              <button
                className={`mini-choice ${selected === choice ? "selected" : ""}`}
                key={choice}
                onClick={() => setSelected(choice)}
                type="button"
              >
                {choice}
              </button>
            ))}
          </div>
          <div className="ai-hint">
            <CircleIcon>AI</CircleIcon>
            <p>
              <strong>{selected ? (isCorrect ? "答对了：" : "小提示：") : "AI 提示："}</strong>
              {selected ? (isCorrect ? "继续保持，下一题会稍微增加难度。" : content.hint) : "先观察，再选择答案。"}
            </p>
          </div>
          {saveError ? <p role="alert">{saveError}</p> : null}
          <div className="practice-actions">
            <AppButton variant="soft" onClick={handleHint}>
              换一种提示（{hintCount}）
            </AppButton>
            <AppButton onClick={handleSubmitAnswer}>
              {submitting ? "正在保存..." : saveError ? "重试保存 →" : isCorrect ? "下一题 →" : "提交答案"}
            </AppButton>
          </div>
        </section>
        </div>
      )}
    </div>
  );
}
