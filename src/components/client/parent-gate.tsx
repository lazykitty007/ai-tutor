"use client";

import { useState } from "react";
import { ButtonLink, LockIcon } from "@/components/primitives";

export function ParentGate() {
  const [selected, setSelected] = useState<number | null>(null);
  const wrong = selected !== null && selected !== 7;

  return (
    <div className="gate-card">
      <LockIcon />
      <h1>家长验证</h1>
      <p>请完成一个简单问题，避免孩子误入家长中心。</p>
      <strong className="math-question">3 + 4 = ?</strong>
      <div className="gate-options">
        {[6, 7, 8].map((value) => (
          <button
            className={selected === value ? "selected" : ""}
            key={value}
            onClick={() => setSelected(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      {wrong ? <p className="error-text">再算一遍，选对后就能进入家长中心。</p> : null}
      <ButtonLink href="/parent/dashboard">进入家长中心 →</ButtonLink>
    </div>
  );
}
