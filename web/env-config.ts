// Загружает переменные из корневого .env (он общий с docker compose).
// Уже заданные переменные окружения не перезаписываются, поэтому
// внутри docker compose работают значения из compose.
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(path.resolve(__dirname, ".."));
