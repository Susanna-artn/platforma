import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// В режиме разработки Next перезагружает модули при каждом изменении.
// Храним подключение в globalThis, чтобы не открывать новое каждый раз.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });

// Нужен скриптам, чтобы закрыть подключение в конце работы
export const pgClient = client;
