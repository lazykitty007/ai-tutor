# AI Tutor Next.js

幼小衔接 AI 个性化辅导 App 原型。项目使用 Next.js App Router，学习数据以 MySQL 为权威数据源，浏览器只保存会话级 UI 状态。

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 启动 MySQL：

```bash
npm run db:up
```

`db:up` 会使用 Docker 创建或启动 `ai-tutor-mysql` 容器。运行前需要先启动 Docker Desktop。

3. 创建表并导入测试数据：

```bash
npm run db:reset
```

默认连接配置见 `.env.example`：

```text
DATABASE_URL=mysql://ai_tutor:ai_tutor_pass@127.0.0.1:3306/ai_tutor_nextjs
```

4. 启动开发服务：

```bash
npm run dev
```

打开 [http://localhost:3000/learn](http://localhost:3000/learn) 查看儿童每日学习页。

## 常用命令

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

数据库脚本：

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

## 数据库文件

- `db/schema.sql`：MySQL 表结构。
- `db/seed.sql`：本地测试数据，包含小宇档案、内容包、知识点、题库、今日计划、学习事件、掌握度和报告。
- `scripts/db.mjs`：执行 migrate、seed、reset。
- `scripts/mysql-up.mjs`：用 Docker 启动本地 MySQL 容器。

## 关键路由

- `/login`：家长建档，提交后写入 MySQL。
- `/learn`：儿童每日旅程，从 MySQL 读取今日计划。
- `/learn/tasks/[taskId]`：学习任务，作答事件写入 `/api/learning/events`。
- `/parent/dashboard`：家长总览，从报告和掌握度读取。
- `/parent/reports/today`：今日学情报告。
- `/admin/content`：内容与知识图谱后台。
