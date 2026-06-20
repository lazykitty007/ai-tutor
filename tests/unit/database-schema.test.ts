import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = path.join(process.cwd(), "db", "schema.sql");

describe("database schema", () => {
  it("defines the MySQL tables required by the design document", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const tables = [...schema.matchAll(/CREATE TABLE\s+([a-z_]+)/g)].map((match) => match[1]);

    expect(tables).toEqual([
      "users",
      "user_credentials",
      "user_sessions",
      "child_profiles",
      "parent_preferences",
      "content_packages",
      "knowledge_nodes",
      "knowledge_relations",
      "question_bank",
      "question_knowledge_nodes",
      "daily_plans",
      "daily_plan_tasks",
      "plan_overrides",
      "learning_sessions",
      "learning_events",
      "question_attempts",
      "mastery_records",
      "reports",
      "report_weaknesses",
    ]);
    expect(schema).toContain("UNIQUE KEY uk_learning_events_client_event_id");
    expect(schema).toContain("UNIQUE KEY uk_daily_plans_child_date");
    expect(schema).toContain("UNIQUE KEY uk_mastery_records_child_knowledge");
    expect(schema).toContain("UNIQUE KEY uk_user_sessions_token_hash");
    expect(schema).toContain("CONSTRAINT fk_user_credentials_user");
  });
});
