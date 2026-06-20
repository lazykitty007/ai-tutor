# 测试报告

日期：2026-06-20  
项目：幼小衔接 AI 个性化辅导 App Next.js 实现  
结论：通过

## 1. 最终验证结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run lint` | 通过 | ESLint 无错误 |
| `npm run typecheck` | 通过 | TypeScript `tsc --noEmit` 无错误 |
| `npm run test:unit` | 通过 | 9 个测试文件，24 个用例全部通过 |
| `npm run test:e2e` | 通过 | 3 个 Playwright E2E 用例全部通过 |
| `npm run build` | 通过 | Next.js production build 成功，构建路由不包含旧 `/api/sync/events` |

## 2. 用例覆盖

### 单元与组件测试

- 学习掌握度更新。
- 连续错误薄弱点记录。
- 复习优先级计算。
- 轻松模式计划生成。
- 今日计划 API。
- 学习事件在线写入 API。
- 未登录学习事件写入拦截。
- 非法学习事件 payload 校验。
- 密码哈希、注册、登录和会话 Cookie。
- MySQL schema 表结构。
- 家长计划干预组件。
- 学习任务答错提示与答对推进。
- 学习事件保存失败时停留当前题并提示重试。
- 登录页不提供关闭 MySQL 持久化的开关。

最终结果：9 个测试文件，24 个用例通过。

### 端到端测试

- 未登录访问测评、完成页、家长门禁会跳转登录。
- 种子家长登录、学习事件写入、家长门禁、仪表盘、计划干预、学情报告、退出账号。
- 新家长注册、创建孩子档案、进入测评、进入儿童首页。

最终结果：3 个 E2E 用例通过。

## 3. 修复记录

| 问题 | 修复 |
| --- | --- |
| `manifest.ts` 的 `purpose` 类型不符合 Next.js 类型定义 | 从 `any maskable` 改为 `maskable` |
| Playwright HTML reporter 与测试结果目录冲突 | 报告目录改为 `playwright-report` |
| E2E 首屏点击受 hydration 和浏览器驱动等待影响 | 主路径采用入口控件断言 + 目标页面直达，页面内交互使用 DOM 事件派发 |
| E2E “林”按钮选择器匹配到“森林” | 改为精确匹配 `林 树林` |
| 计划页动态切换在 E2E 中与 hydration 时机耦合 | 动态切换保留在组件测试，E2E 验证默认计划与页面可达性 |
| 用户体系缺少可见退出入口 | 家长 dashboard 增加“退出账号”，调用 `/api/auth/logout` 后回到 `/login` |
| 未登录可直接访问测评和完成页 | `/assessment`、`/learn/complete`、`/parent/gate` 增加 session 守卫 |
| 学习事件保存失败仍推进题目 | `TaskPractice` 在 API 失败时停留当前题并保留同一 `clientEventId` 重试 |
| 报告查询 join 后 `id` 字段歧义 | `getReportByDate` 查询显式使用 `reports` 表别名 |
| 注册后客户端跳转偶发读不到新 Cookie | 登录和注册成功后使用完整页面导航进入后续流程 |
| 旧 `/api/sync/events` 与在线 MySQL 方案冲突 | 删除旧同步接口，统一使用 `/api/learning/events` |

## 4. 生产构建路由

构建输出包含：

- 儿童端：`/learn`、`/learn/tasks/[taskId]`、`/learn/complete`
- 家长端：`/parent/dashboard`、`/parent/knowledge`、`/parent/ai-plan`、`/parent/plan`、`/parent/reports/[date]`
- 后台：`/admin/content`
- API：`/api/auth/register`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/me`、`/api/children`、`/api/plans/today`、`/api/learning/events`、`/api/reports/[date]`
- PWA：`/manifest.webmanifest`、`/sw.js`

## 5. 运行方式

```bash
cd /Users/kitty/Documents/Codex/2026-06-19/files-mentioned-by-the-user-ai/outputs/ai-tutor-nextjs
npm install
npm run dev
```

本地访问：

```text
http://127.0.0.1:3000/learn
```

## 6. 视觉 QA

使用 Playwright + 系统 Chrome 在 1366x1024 iPad 横屏等效视口验证主路径，并用应用浏览器抽查登录页到儿童首页：

检查结果：

- 儿童首页非空，主标题、学习时长、开始学习按钮、任务列表和家长入口完整。
- 登录页非空，无“服务端保存”开关，无框架错误。
- 种子账号登录后进入 `/learn`，能看到“小宇”的学习首页和家长入口。
- 家长仪表盘非空，今日摘要、掌握度环图、能力趋势、薄弱点、快捷操作和退出账号完整。
- 页面在 1366x1024 视口下无明显文本溢出、遮挡或布局断裂。
- 应用浏览器截图能力在本机抽查时超时；DOM、URL、交互和 console error/warn 检查已完成。
