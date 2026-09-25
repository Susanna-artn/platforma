// Проверка данных из форм админки. Без базы - легко тестировать.
import { z } from "zod";
import { todayIso } from "@/lib/format";

export const CREATABLE_ROLES = ["teacher", "student", "parent"] as const;

const name = z
  .string()
  .trim()
  .min(1, "Укажите имя")
  .max(50, "Слишком длинное имя")
  .regex(/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё -]*$/, "Имя: только буквы, пробел и дефис");

const lastInitial = z
  .string()
  .trim()
  .regex(/^[A-Za-zА-Яа-яЁё]$/, "Первая буква фамилии: ровно одна буква")
  .transform((s) => s.toUpperCase());

export const loginSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9._-]{3,32}$/,
    "Логин: 3-32 символа, латинские буквы, цифры, точка, дефис, подчёркивание",
  );

export const gradeSchema = z.coerce
  .number({ message: "Укажите класс" })
  .int()
  .min(9, "Класс от 9 до 11")
  .max(11, "Класс от 9 до 11");

export const createUserSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("student"),
    login: loginSchema,
    firstName: name,
    lastInitial,
    grade: gradeSchema,
  }),
  z.object({ role: z.literal("teacher"), login: loginSchema, firstName: name, lastInitial }),
  z.object({ role: z.literal("parent"), login: loginSchema, firstName: name, lastInitial }),
]);

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Дата согласия из поля <input type="date">: не в будущем (по московскому времени).
// Даты YYYY-MM-DD можно сравнивать как строки.
export const consentDateSchema = z.iso
  .date("Укажите дату согласия")
  .refine((s) => s <= todayIso(), "Дата согласия не может быть в будущем")
  .transform((s) => new Date(s + "T00:00:00Z"));

// Первое сообщение об ошибке для каждого поля формы
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
