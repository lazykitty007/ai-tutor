# 测试用例

## 1. 单元测试

| 文件 | 用例 | 覆盖需求 |
| --- | --- | --- |
| `tests/unit/learning-engine.test.ts` | 正确快速答题提升掌握度 | AI 个性化画像和掌握度更新 |
| `tests/unit/learning-engine.test.ts` | 连续错误降低掌握度并追加薄弱标签 | AI 纠错、薄弱点记录 |
| `tests/unit/learning-engine.test.ts` | 低掌握度和多错误优先复习 | 复习计划生成 |
| `tests/unit/learning-engine.test.ts` | 轻松模式不安排新知识 | 家长计划干预 |
| `tests/unit/api.test.ts` | 今日计划 API 返回任务 | 每日计划服务 |
| `tests/unit/api.test.ts` | 学习事件 API 只持久化合法事件并统计非法事件 | 在线 MySQL 学习事件写入 |
| `tests/unit/api.test.ts` | 未登录写入学习事件返回 401 | 用户体系与数据权限 |
| `tests/unit/api.test.ts` | 非法学习事件 payload 返回 400 | API 输入校验 |

## 2. 组件测试

| 文件 | 用例 | 覆盖需求 |
| --- | --- | --- |
| `tests/component/plan-editor.test.tsx` | 默认展示轻松计划并可调整时长 | 家长计划干预交互 |
| `tests/component/plan-editor.test.tsx` | 关闭轻松模式后显示新字学习 | AI 计划即时重算 |
| `tests/component/task-practice.test.tsx` | 识字答错后展示 AI 提示 | 实时辅导 |
| `tests/component/task-practice.test.tsx` | 识字答对后进入下一题状态 | 学习任务执行 |
| `tests/component/task-practice.test.tsx` | 学习事件保存失败时停留当前题并提示重试 | 在线写入失败处理 |
| `tests/component/onboarding-form.test.tsx` | 登录页不提供关闭 MySQL 持久化的开关 | MySQL 作为唯一权威数据源 |

## 3. 端到端测试

| 文件 | 用例 | 覆盖需求 |
| --- | --- | --- |
| `tests/e2e/main-flow.spec.ts` | 未登录访问测评、完成页、家长门禁会跳转登录 | 用户体系守卫 |
| `tests/e2e/main-flow.spec.ts` | 种子家长登录 -> 学习事件写入 -> 家长报告 | 已有账号完整使用闭环 |
| `tests/e2e/main-flow.spec.ts` | 新家长注册 -> 创建孩子 -> 测评 -> 儿童首页 | 新账号首次使用闭环 |

## 4. 验证命令

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

项目最终测试报告输出到 `docs/TEST_REPORT.md`。
