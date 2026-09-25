// Разбор файла импорта и составление отчёта. Без базы: текущее состояние
// базы передаётся параметром, поэтому функцию легко тестировать.
import type { z } from "zod";
import type { Subject } from "@/db/schema";
import { importFileSchema, type ImportFile } from "./schema";

export type ExistingState = {
  // код темы -> предмет
  topics: Map<string, Subject>;
  taskCodes: Set<string>;
};

export type ImportReport = {
  errors: string[];
  newTopics: string[];
  updatedTopics: string[];
  newTasks: string[];
  updatedTasks: string[];
};

export type ImportPlan = { report: ImportReport; file: ImportFile | null };

function emptyReport(errors: string[]): ImportReport {
  return { errors, newTopics: [], updatedTopics: [], newTasks: [], updatedTasks: [] };
}

// "tasks[2] (m9-quad-003): answer.tolerance - сообщение"
function describeIssue(issue: z.core.$ZodIssue, raw: unknown): string {
  const [section, index, ...rest] = issue.path;
  if ((section === "tasks" || section === "topics") && typeof index === "number") {
    const item = (raw as Record<string, unknown[]>)[section]?.[index] as
      | { code?: unknown }
      | undefined;
    const label = section === "tasks" ? "Задача" : "Тема";
    const codePart = typeof item?.code === "string" ? ` (${item.code})` : "";
    const field = rest.length ? `${rest.join(".")}: ` : "";
    return `${label} №${index + 1}${codePart}: ${field}${issue.message}`;
  }
  const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${field}${issue.message}`;
}

function duplicates(codes: string[]): string[] {
  const seen = new Set<string>();
  const result = new Set<string>();
  for (const c of codes) {
    if (seen.has(c)) result.add(c);
    seen.add(c);
  }
  return [...result];
}

export function planImport(text: string, existing: ExistingState): ImportPlan {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    return { file: null, report: emptyReport([`Файл - не корректный JSON: ${reason}`]) };
  }

  const parsed = importFileSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => describeIssue(i, raw));
    return { file: null, report: emptyReport(errors) };
  }

  const file = parsed.data;
  const topics = file.topics ?? [];
  const tasks = file.tasks ?? [];
  const errors: string[] = [];

  if (topics.length === 0 && tasks.length === 0) errors.push("В файле нет ни тем, ни задач");

  for (const c of duplicates(topics.map((t) => t.code))) {
    errors.push(`Тема ${c} встречается в файле несколько раз`);
  }
  for (const c of duplicates(tasks.map((t) => t.code))) {
    errors.push(`Задача ${c} встречается в файле несколько раз`);
  }

  // Предмет темы после импорта: из файла, иначе из базы
  const topicSubject = new Map(existing.topics);
  for (const t of topics) {
    const before = existing.topics.get(t.code);
    if (before && before !== t.subject) {
      errors.push(`Тема ${t.code}: предмет существующей темы менять нельзя (${before})`);
    }
    topicSubject.set(t.code, t.subject);
  }

  tasks.forEach((task, i) => {
    const subject = topicSubject.get(task.topic);
    const label = `Задача №${i + 1} (${task.code})`;
    if (!subject) {
      errors.push(`${label}: темы ${task.topic} нет ни в файле, ни в базе`);
    } else if (subject !== task.subject) {
      errors.push(`${label}: тема ${task.topic} относится к другому предмету (${subject})`);
    }
  });

  const report: ImportReport = {
    errors,
    newTopics: topics.filter((t) => !existing.topics.has(t.code)).map((t) => t.code),
    updatedTopics: topics.filter((t) => existing.topics.has(t.code)).map((t) => t.code),
    newTasks: tasks.filter((t) => !existing.taskCodes.has(t.code)).map((t) => t.code),
    updatedTasks: tasks.filter((t) => existing.taskCodes.has(t.code)).map((t) => t.code),
  };
  return { report, file: errors.length ? null : file };
}
