"use client";

import { useState } from "react";
import { AppButton, ProgressBars } from "@/components/primitives";
import { assessmentChoices } from "@/lib/demo-data";

export function AssessmentCard() {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = assessmentChoices.find((choice) => choice.correct)?.char;

  return (
    <div className="assessment-flow">
      <div className="assessment-head">
        <div>
          <p className="section-label">听一听，再选择</p>
          <h1>哪个字读作 “lín”？</h1>
          <p>不用着急，选你觉得最像的那个。</p>
        </div>
        <div className="progress-block">
          <span>测评进度</span>
          <strong>2 / 8</strong>
          <ProgressBars value={2} total={8} />
        </div>
      </div>
      <div className="choice-grid">
        {assessmentChoices.map((choice) => (
          <button
            className={`choice-card ${selected === choice.char ? "selected" : ""}`}
            key={choice.char}
            onClick={() => setSelected(choice.char)}
            type="button"
          >
            <strong>{choice.char}</strong>
            <span>{choice.label}</span>
          </button>
        ))}
      </div>
      <div className="feedback-row">
        <div className="hint-box">
          <span className="circle-icon green">音</span>
          <p>
            {selected
              ? selected === correct
                ? "选对了。AI 已记录这道题答题稳定。"
                : "再听一遍读音，看看哪个字像两棵小树。"
              : "AI 会记录正确率、反应时间和是否需要提示。"}
          </p>
        </div>
        <AppButton
          variant="soft"
          onClick={() => {
            const utterance = new SpeechSynthesisUtterance("lin");
            utterance.lang = "zh-CN";
            window.speechSynthesis?.speak(utterance);
          }}
        >
          听一遍读音
        </AppButton>
        <AppButton
          onClick={() => {
            if (selected === correct) {
              window.location.assign("/learn");
            }
          }}
        >
          进入今日学习 →
        </AppButton>
      </div>
    </div>
  );
}
