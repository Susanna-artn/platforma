// Создаёт первого администратора из переменных ADMIN_* в .env.
// Запуск: npm run seed:admin
import { eq } from "drizzle-orm";
import { db, pgClient } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

async function main() {
  const login = process.env.ADMIN_LOGIN?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const firstName = process.env.ADMIN_FIRST_NAME?.trim();
  const lastInitial = process.env.ADMIN_LAST_INITIAL?.trim();

  if (!login || !firstName || !lastInitial) {
    throw new Error("Заполните ADMIN_LOGIN, ADMIN_FIRST_NAME и ADMIN_LAST_INITIAL в .env");
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.startsWith("change-me")) {
    throw new Error(
      `Задайте в .env свой ADMIN_PASSWORD длиной не меньше ${MIN_PASSWORD_LENGTH} символов`,
    );
  }

  const existing = await db.query.users.findFirst({ where: eq(users.login, login) });
  if (existing) {
    console.log(`Пользователь ${login} уже есть, ничего не меняю.`);
    return;
  }

  await db.insert(users).values({
    login,
    passwordHash: await hashPassword(password),
    role: "admin",
    firstName,
    lastInitial: lastInitial.slice(0, 1).toUpperCase(),
  });
  console.log(`Администратор ${login} создан.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pgClient.end());
