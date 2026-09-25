// Запускает команду с переменными из корневого .env (он общий с docker compose).
// Пример: node scripts/with-env.mjs next dev
// Уже заданные переменные окружения не перезаписываются.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, {
  stdio: "inherit",
  // На Windows команды из node_modules/.bin - это .cmd-файлы, им нужна оболочка
  shell: process.platform === "win32",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
