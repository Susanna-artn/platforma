import { describe, expect, it } from "vitest";
import { todayIso } from "./format";
import { consentDateSchema, createUserSchema, fieldErrors, loginSchema } from "./user-validation";

describe("логин", () => {
  it("приводится к нижнему регистру и обрезается", () => {
    expect(loginSchema.parse("  Ivan.P ")).toBe("ivan.p");
  });

  it("отклоняет кириллицу, пробелы и слишком короткие", () => {
    for (const bad of ["иван", "ivan p", "ab", "a".repeat(33)]) {
      expect(loginSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("создание пользователя", () => {
  it("ученику нужен класс 9-11", () => {
    const base = { role: "student", login: "vasya", firstName: "Вася", lastInitial: "к" };
    expect(createUserSchema.safeParse(base).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, grade: "8" }).success).toBe(false);
    const ok = createUserSchema.parse({ ...base, grade: "10" });
    expect(ok).toMatchObject({ grade: 10, lastInitial: "К" });
  });

  it("родителю класс не нужен", () => {
    const result = createUserSchema.safeParse({
      role: "parent",
      login: "mama",
      firstName: "Ольга",
      lastInitial: "К",
    });
    expect(result.success).toBe(true);
  });

  it("нельзя создать администратора через форму", () => {
    const result = createUserSchema.safeParse({
      role: "admin",
      login: "boss",
      firstName: "Иван",
      lastInitial: "И",
    });
    expect(result.success).toBe(false);
  });

  it("первая буква фамилии - ровно одна буква", () => {
    const result = createUserSchema.safeParse({
      role: "teacher",
      login: "anna",
      firstName: "Анна",
      lastInitial: "Сидорова",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toHaveProperty("lastInitial");
  });
});

describe("дата согласия", () => {
  it("сегодня можно, в будущем нельзя", () => {
    expect(consentDateSchema.safeParse(todayIso()).success).toBe(true);
    expect(consentDateSchema.safeParse("2099-01-01").success).toBe(false);
  });

  it("сохраняется как полночь по UTC", () => {
    expect(consentDateSchema.parse("2026-09-20").toISOString()).toBe("2026-09-20T00:00:00.000Z");
  });
});
