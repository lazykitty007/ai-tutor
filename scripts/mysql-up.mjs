import { spawnSync } from "node:child_process";

const containerName = "ai-tutor-mysql";

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const dockerInfo = run("docker", ["info", "--format", "{{.ServerVersion}}"]);
if (dockerInfo.status !== 0) {
  fail("Docker daemon is not running. Start Docker Desktop, then run npm run db:up again.");
}

const existing = run("docker", ["ps", "-a", "--filter", `name=^/${containerName}$`, "--format", "{{.Names}}"]);
if (existing.stdout.trim() === containerName) {
  const started = run("docker", ["start", containerName]);
  if (started.status !== 0) {
    fail(started.stderr || `Failed to start ${containerName}.`);
  }
  console.log(`${containerName} started.`);
  process.exit(0);
}

const created = run("docker", [
  "run",
  "-d",
  "--name",
  containerName,
  "--restart",
  "unless-stopped",
  "-e",
  "MYSQL_ROOT_PASSWORD=rootpass",
  "-e",
  "MYSQL_DATABASE=ai_tutor_nextjs",
  "-e",
  "MYSQL_USER=ai_tutor",
  "-e",
  "MYSQL_PASSWORD=ai_tutor_pass",
  "-p",
  "3306:3306",
  "-v",
  "ai-tutor-mysql-data:/var/lib/mysql",
  "mysql:8.4",
]);

if (created.status !== 0) {
  fail(created.stderr || "Failed to create MySQL container.");
}

console.log(`${containerName} created and started.`);
