import type { Role } from "@/db/schema";

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
