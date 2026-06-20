"use client";

import { useMemo, useState } from "react";
import { AppButton, Pill } from "@/components/primitives";
import { childProfile, knowledgeNodes, masteryRecords } from "@/lib/demo-data";
import { generateDailyPlan, type KnowledgeNode, type MasteryRecord } from "@/lib/learning-engine";

type PlanEditorProps = {
  childName?: string;
  targetDate?: string;
  initialMinutes?: number;
  knowledgeNodes?: KnowledgeNode[];
  masteryRecords?: MasteryRecord[];
};

export function PlanEditor({
  childName = childProfile.name,
  targetDate = "tomorrow",
  initialMinutes = childProfile.dailyMinutes,
  knowledgeNodes: initialKnowledgeNodes = knowledgeNodes,
  masteryRecords: initialMasteryRecords = masteryRecords,
}: PlanEditorProps) {
  const [relaxed, setRelaxed] = useState(true);
  const [pauseNew, setPauseNew] = useState(false);
  const [minutes, setMinutes] = useState(initialMinutes);
  const plan = useMemo(
    () =>
      generateDailyPlan({
        childName,
        targetDate,
        dailyMinutes: minutes,
        records: initialMasteryRecords,
        nodes: initialKnowledgeNodes,
        relaxedMode: relaxed || pauseNew,
      }),
    [childName, initialKnowledgeNodes, initialMasteryRecords, minutes, pauseNew, relaxed, targetDate],
  );

  return (
    <div className="plan-editor">
      <section className="panel">
        <h2>干预设置</h2>
        <ToggleRow checked={relaxed} description="减少新知识，增加复习" label="轻松模式" onChange={() => setRelaxed((value) => !value)} />
        <ToggleRow checked={pauseNew} description="只做旧知识巩固" label="暂停新知识" onChange={() => setPauseNew((value) => !value)} />
        <ToggleRow checked description="完成后提醒家长查看" label="报告推送" onChange={() => undefined} />
        <div className="duration-picker">
          <p>每日时长</p>
          {[10, 15, 20, 30].map((value) => (
            <button className={minutes === value ? "active" : ""} key={value} onClick={() => setMinutes(value)} type="button">
              {value} 分钟
            </button>
          ))}
        </div>
      </section>
      <section className="panel plan-preview">
        <div className="panel-title-row">
          <h2>明日计划预览</h2>
          <AppButton variant="soft">保存调整</AppButton>
        </div>
        <div className="plan-list">
          {plan.tasks.map((task, index) => (
            <div className="plan-item" key={task.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{task.title}</strong>
                <p>{task.description}</p>
              </div>
              <em>{task.minutes} 分钟</em>
            </div>
          ))}
        </div>
        <div className="note-box">
          <strong>AI 说明：</strong>
          {relaxed || pauseNew ? "已根据轻松设置减少新字，只保留低压力巩固任务。" : "已加入少量新知识，并保留薄弱点复习。"}
        </div>
        <Pill>{plan.headline}</Pill>
      </section>
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: () => void;
}) {
  return (
    <button className="toggle-row" onClick={onChange} type="button">
      <span>
        <strong>{label}</strong>
        <em>{description}</em>
      </span>
      <i className={`toggle ${checked ? "on" : ""}`}>
        <b />
      </i>
    </button>
  );
}
