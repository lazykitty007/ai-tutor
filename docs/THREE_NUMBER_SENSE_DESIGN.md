# Three.js 数感游戏技术设计

## 目标

把 `/learn/tasks/math` 从普通选择题升级为可操作的 3D 数感课件。首版聚焦 `quantity_compare`：左边 7 个圆片、右边 5 个圆片，孩子可以点数、配对、切换十格阵，再选择答案。

设计原则：

- 低刺激：延续现有纸感背景、深蓝文字、柔和绿色和金色强调。
- 可观察：用 3D 圆片位移表达“点数”“一一配对”“多出来”。
- 不绕过学习系统：选择、提示、保存失败重试继续复用 `TaskPractice` 的学习事件逻辑。
- 按需加载：Three.js/R3F 只在数学任务进入客户端 chunk，不影响识字和拼音任务。

## 页面结构

入口仍是：

```text
/learn/tasks/[taskId]
```

当 `task.type === "math"` 时，`TaskPractice` 渲染 `NumberSenseGame`：

```text
TaskPage
  ScreenShell
    TaskPractice
      task-head
      NumberSenseGame
        number-sense-stage
          Canvas / NumberSenseScene
          点数仪表
          点数 / 配对 / 十格阵
        number-sense-panel
          题面
          左右数量摘要
          答案选择
          AI 策略提示
          提示 / 提交
```

非数学任务继续走原来的 `char-stage + practice-panel` 布局。

## 组件边界

| 文件 | 职责 |
| --- | --- |
| `src/components/client/task-practice.tsx` | 任务通用状态、进度、保存、提示、提交、路由跳转 |
| `src/components/client/number-sense-game.tsx` | 数感课件 UI、R3F Canvas、圆片点数/配对/十格阵交互 |
| `src/app/globals.css` | 低刺激 3D 操作台布局、响应式和按钮状态 |

`NumberSenseGame` 不直接调用 API，只通过 props 调用 `onSelect`、`onHint`、`onSubmit`。这样后续题库/事件策略变化时，只需要改 `TaskPractice` 或数据层。

## Three.js 场景设计

当前场景使用 R3F 原生能力：

- `Canvas`：数学任务专用 3D 舞台。
- `cylinderGeometry`：圆片学具。
- `boxGeometry`：桌面、十格阵格子、配对辅助线。
- `ambientLight + directionalLight`：保证 iPad 屏幕下清晰可见。
- `useFrame`：圆片平滑移动到点数、配对或十格阵位置。
- `onPointerDown`：点击圆片切换已点数状态。

首版不引入 `@react-three/drei`，避免为简单课件增加额外依赖。

## 交互状态

```ts
type LessonMode = "count" | "pair" | "ten-frame";
```

| 状态 | 视觉行为 | 教学意义 |
| --- | --- | --- |
| `count` | 左右两组圆片自然摆放，点击后变金色 | 每个圆片只数一次 |
| `pair` | 圆片逐步移动成左右一一配对，多出的左侧圆片高亮 | 比较多少优先用配对策略 |
| `ten-frame` | 左侧 7 个圆片进入十格阵 | 建立 5+2 的数量直觉 |

提示按钮会切到完整配对状态，展示左边多出 2 个。

## 事件与数据

当前实现复用已有学习事件：

- `hint_shown`
  - `hintLevel`
  - `hintTextKey`
  - `questionId`
- `item_answered`
  - `selectedAnswer`
  - `correctAnswer`
  - `isCorrect`
  - `durationMs`
  - `hintCount`
  - `wrongStreak`
  - `inputMode`
- `task_completed`
  - `progress`
  - `total`

后续建议把 `question_bank.display` 透传到客户端，形成通用 schema：

```ts
type NumberSenseDisplay =
  | {
      visual: "counters";
      layout: "pairable";
      leftCount: number;
      rightCount: number;
      showNumeralsInitially: boolean;
    }
  | {
      visual: "ten_frame";
      filled: number;
    };
```

届时 `NumberSenseGame` 可以从固定 `7 vs 5` 扩展为题库驱动。

## 性能策略

- 使用 `next/dynamic` 动态加载 `NumberSenseGame`，并设置 `ssr: false`。
- Three.js 依赖只进入数学任务 chunk。
- 圆片数量首版固定在 12 个以内，避免低端 iPad 帧率压力。
- 不使用纹理和模型文件，减少首屏资源请求。
- 画布尺寸由 CSS 固定最小高度，避免 Canvas 加载后页面跳动。

## 验收重点

- `/learn/tasks/math` 能渲染 3D 操作台，不出现空白 Canvas。
- 点击圆片后“已点数”数字变化。
- 点击“配对”后圆片移动成一一对应关系。
- 点击“十格阵”后左侧 7 个圆片进入十格阵。
- 选择“左边更多”后 AI 提示显示正确反馈。
- 提示和提交仍能走原有事件保存逻辑。
- iPad 横屏和手机宽度下不出现文字重叠、按钮溢出或 Canvas 遮挡。

## 本地验证记录

验证日期：2026-06-20。

命令验证：

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test:unit`：9 个测试文件、26 个测试通过。
- `npm run build`：通过，Next.js 生产构建成功。
- `npm run db:reset && npm run test:e2e`：3 个 Playwright E2E 用例通过。E2E 依赖干净的种子库，若本地手动 QA 改过学习进度，需要先重置数据库。

浏览器验证：

- 桌面视口 `1366x1024`：`/learn/tasks/math` 渲染 3D Canvas，舞台尺寸约 `738x525`，无横向溢出。
- 手机视口 `390x844`：3D 操作台缩放后仍在可视宽度内，舞台尺寸约 `344x360`，无横向溢出。
- 点击 Canvas 后“已点数”从 `0` 变为 `1`。
- 点击“配对”后工具栏进入配对状态。
- 点击“十格阵”后工具栏进入十格阵状态。
- 选择“左边更多”后显示“答对了”反馈。
- 对舞台截图区域做像素统计，桌面和手机截图均非单色空白区域。
- 独立 Chrome 上下文未捕获相关 `console.error` 或页面运行时错误。
