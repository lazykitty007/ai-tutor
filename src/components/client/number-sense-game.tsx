"use client";

import { useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Mesh } from "three";
import { useRef } from "react";
import { AppButton, CircleIcon } from "@/components/primitives";
import type { DailyTask } from "@/lib/learning-engine";

type LessonMode = "count" | "pair" | "ten-frame";

type NumberSenseGameProps = {
  task: DailyTask;
  choices: readonly string[];
  prompt: string;
  hint: string;
  selected: string | null;
  isCorrect: boolean;
  hintCount: number;
  submitting: boolean;
  saveError: string | null;
  onSelect: (choice: string) => void;
  onHint: () => void;
  onSubmit: () => void;
};

type CounterConfig = {
  id: string;
  side: "left" | "right";
  index: number;
};

const leftCount = 7;
const rightCount = 5;
const leftCounters = Array.from({ length: leftCount }, (_, index) => ({ id: `left-${index}`, side: "left" as const, index }));
const rightCounters = Array.from({ length: rightCount }, (_, index) => ({ id: `right-${index}`, side: "right" as const, index }));
const counters = [...leftCounters, ...rightCounters];

function pilePosition(side: CounterConfig["side"], index: number): [number, number, number] {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const xOrigin = side === "left" ? -3.2 : 2.2;
  return [xOrigin + column * 0.62, 0.22, row * 0.58 - 1.24];
}

function pairPosition(side: CounterConfig["side"], index: number): [number, number, number] {
  const row = index;
  const x = side === "left" ? -0.58 : 0.58;
  return [x, 0.22, row * 0.46 - 1.1];
}

function extraPosition(index: number): [number, number, number] {
  return [-1.72 + (index - rightCount) * 0.62, 0.26, 1.75];
}

function tenFramePosition(index: number): [number, number, number] {
  const column = index % 5;
  const row = Math.floor(index / 5);
  return [-1.76 + column * 0.88, 0.24, row * 0.82 - 0.42];
}

function getTargetPosition(counter: CounterConfig, mode: LessonMode, pairedCount: number): [number, number, number] {
  if (mode === "ten-frame" && counter.side === "left") {
    return tenFramePosition(counter.index);
  }

  if (mode === "pair") {
    if (counter.index < rightCount && counter.index < pairedCount) {
      return pairPosition(counter.side, counter.index);
    }
    if (counter.side === "left" && counter.index >= rightCount && pairedCount >= rightCount) {
      return extraPosition(counter.index);
    }
  }

  return pilePosition(counter.side, counter.index);
}

function Counter({
  counter,
  mode,
  pairedCount,
  counted,
}: {
  counter: CounterConfig;
  mode: LessonMode;
  pairedCount: number;
  counted: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const target = getTargetPosition(counter, mode, pairedCount);
  const isExtra = mode === "pair" && counter.side === "left" && counter.index >= rightCount && pairedCount >= rightCount;
  const isPaired = mode === "pair" && counter.index < pairedCount && counter.index < rightCount;

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    mesh.position.x += (target[0] - mesh.position.x) * 0.12;
    mesh.position.y += (target[1] - mesh.position.y) * 0.12;
    mesh.position.z += (target[2] - mesh.position.z) * 0.12;
    mesh.rotation.y += 0.012;
    mesh.position.y += Math.sin(state.clock.elapsedTime * 2 + counter.index) * 0.0015;
  });

  return (
    <mesh
      position={pilePosition(counter.side, counter.index)}
      ref={meshRef}
    >
      <cylinderGeometry args={[0.28, 0.28, 0.18, 36]} />
      <meshStandardMaterial
        color={counted ? "#e2b33b" : counter.side === "left" ? "#5e946f" : "#6f89a6"}
        emissive={isExtra ? "#d9a62d" : isPaired ? "#6da982" : "#000000"}
        emissiveIntensity={isExtra ? 0.22 : isPaired ? 0.08 : 0}
        metalness={0.05}
        roughness={0.62}
      />
    </mesh>
  );
}

function TenFrameSlots({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <group position={[0, 0.03, -0.42]}>
      {Array.from({ length: 10 }, (_, index) => {
        const column = index % 5;
        const row = Math.floor(index / 5);
        return (
          <mesh key={index} position={[-1.76 + column * 0.88, 0.02, row * 0.82]}>
            <boxGeometry args={[0.72, 0.04, 0.62]} />
            <meshStandardMaterial color="#fbfff7" metalness={0} roughness={0.78} />
          </mesh>
        );
      })}
    </group>
  );
}

function PairingRails({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <group>
      {Array.from({ length: rightCount }, (_, index) => (
        <mesh key={index} position={[0, 0.055, index * 0.46 - 1.1]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.05, 1.04, 0.05]} />
          <meshStandardMaterial color="#cfdcc8" metalness={0} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function NumberSenseScene({
  mode,
  pairedCount,
  countedIds,
}: {
  mode: LessonMode;
  pairedCount: number;
  countedIds: Set<string>;
}) {
  return (
    <Canvas camera={{ fov: 42, position: [0, 6.4, 6.8] }}>
      <color attach="background" args={["#f2f7ed"]} />
      <ambientLight intensity={0.75} />
      <directionalLight intensity={1.1} position={[2.8, 6, 4]} />
      <NumberSenseSceneContent countedIds={countedIds} mode={mode} pairedCount={pairedCount} />
    </Canvas>
  );
}

function NumberSenseSceneContent({
  mode,
  pairedCount,
  countedIds,
}: {
  mode: LessonMode;
  pairedCount: number;
  countedIds: Set<string>;
}) {
  const { size } = useThree();
  const sceneScale = size.width < 420 ? 0.68 : size.width < 620 ? 0.82 : 1;

  return (
    <>
      <group rotation={[-0.24, 0, 0]} scale={sceneScale}>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[6.9, 0.08, 4.35]} />
          <meshStandardMaterial color="#e4eddd" metalness={0} roughness={0.88} />
        </mesh>
        <TenFrameSlots visible={mode === "ten-frame"} />
        <PairingRails visible={mode === "pair"} />
        {counters.map((counter) => (
          <Counter
            counter={counter}
            counted={countedIds.has(counter.id)}
            key={counter.id}
            mode={mode}
            pairedCount={pairedCount}
          />
        ))}
      </group>
    </>
  );
}

export function NumberSenseGame({
  task,
  choices,
  prompt,
  hint,
  selected,
  isCorrect,
  hintCount,
  submitting,
  saveError,
  onSelect,
  onHint,
  onSubmit,
}: NumberSenseGameProps) {
  const [mode, setMode] = useState<LessonMode>("count");
  const [pairedCount, setPairedCount] = useState(0);
  const [countedIds, setCountedIds] = useState<Set<string>>(() => new Set());
  const countedLeft = useMemo(() => Array.from(countedIds).filter((id) => id.startsWith("left")).length, [countedIds]);

  function countNextLeftCounter() {
    setCountedIds((current) => {
      const next = new Set(current);
      const targetCounter = leftCounters.find((counter) => !next.has(counter.id));
      if (targetCounter) {
        next.add(targetCounter.id);
      }
      return next;
    });
  }

  function showPairing() {
    setMode("pair");
    setPairedCount((value) => Math.min(rightCount, value + 1));
  }

  function showAllPairs() {
    setMode("pair");
    setPairedCount(rightCount);
  }

  return (
    <div className="number-sense-layout">
      <section className="number-sense-stage" aria-label="3D 数感操作区">
        <div
          className="number-sense-canvas"
          data-testid="number-sense-canvas"
          onPointerDown={(event) => {
            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() === "canvas") {
              setMode("count");
              countNextLeftCounter();
            }
          }}
        >
          <NumberSenseScene countedIds={countedIds} mode={mode} pairedCount={pairedCount} />
          <div className="number-sense-meter" aria-live="polite">
            <span>已点数</span>
            <strong>{countedLeft}</strong>
          </div>
        </div>
        <div className="number-sense-toolbar" aria-label="数感操作">
          <button className={mode === "count" ? "active" : ""} onClick={() => setMode("count")} type="button">
            点数
          </button>
          <button className={mode === "pair" ? "active" : ""} onClick={showPairing} type="button">
            配对
          </button>
          <button className={mode === "ten-frame" ? "active" : ""} onClick={() => setMode("ten-frame")} type="button">
            十格阵
          </button>
        </div>
      </section>

      <aside className="number-sense-panel">
        <div>
          <p className="section-label">数感操作台</p>
          <h2>{prompt}</h2>
          <p>{task.description}</p>
        </div>

        <div className="number-sense-facts" aria-label="题目数量">
          <div>
            <span>左边</span>
            <strong>{leftCount}</strong>
          </div>
          <div>
            <span>右边</span>
            <strong>{rightCount}</strong>
          </div>
          <div>
            <span>多出</span>
            <strong>{leftCount - rightCount}</strong>
          </div>
        </div>

        <div className="number-sense-choice-grid">
          {choices.map((choice) => (
            <button
              className={`number-sense-choice ${selected === choice ? "selected" : ""}`}
              key={choice}
              onClick={() => onSelect(choice)}
              type="button"
            >
              {choice}
            </button>
          ))}
        </div>

        <div className="ai-hint number-sense-hint">
          <CircleIcon>AI</CircleIcon>
          <p>
            <strong>{selected ? (isCorrect ? "答对了：" : "小提示：") : "AI 提示："}</strong>
            {selected
              ? isCorrect
                ? "你已经用数量关系找到了更多的一边。"
                : hint
              : pairedCount >= rightCount
                ? "右边每个圆片都配上了，左边还剩 2 个。"
                : "可以先点数，再试着把两边圆片一一配对。"}
          </p>
        </div>

        {saveError ? (
          <p className="task-save-error" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="number-sense-actions">
          <AppButton
            variant="soft"
            onClick={() => {
              onHint();
              showAllPairs();
            }}
          >
            换一种提示（{hintCount}）
          </AppButton>
          <AppButton onClick={onSubmit}>{submitting ? "正在保存..." : saveError ? "重试保存 →" : isCorrect ? "下一题 →" : "提交答案"}</AppButton>
        </div>
      </aside>
    </div>
  );
}
