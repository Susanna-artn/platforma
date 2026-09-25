import type { AnswerType, Exam, Role, Subject, TaskStatus } from "@/db/schema";

export const ROLE_TITLE: Record<Role, string> = {
  admin: "Администратор",
  teacher: "Преподаватель",
  student: "Ученик",
  parent: "Родитель",
};

export function shortName(user: { firstName: string; lastInitial: string }): string {
  return `${user.firstName} ${user.lastInitial}.`;
}

// Дата согласия хранится как полночь по UTC, показываем её без сдвига пояса
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { timeZone: "UTC" });
}

// Сегодняшняя дата по Москве в формате YYYY-MM-DD для <input type="date">
export function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });
}

export const SUBJECT_TITLE: Record<Subject, string> = {
  math: "Математика",
  physics: "Физика",
};

export const EXAM_TITLE: Record<Exam, string> = {
  oge: "ОГЭ",
  ege_base: "ЕГЭ база",
  ege_profile: "ЕГЭ профиль",
  ege: "ЕГЭ",
};

export const STATUS_TITLE: Record<TaskStatus, string> = {
  draft: "черновик",
  published: "опубликована",
  archived: "в архиве",
};

export const DIFFICULTY_TITLE: Record<number, string> = {
  1: "базовый",
  2: "повышенный",
  3: "высокий",
};

export const ANSWER_TYPE_TITLE: Record<AnswerType, string> = {
  number: "число",
  expression: "выражение",
  roots: "корни",
  interval: "промежуток",
  tuple: "набор",
  quantity: "величина",
  digits: "цифры",
  steps: "решение по шагам",
};
