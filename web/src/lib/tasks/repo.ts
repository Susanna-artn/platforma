// Работа с банком задач в базе. Права проверяются в server actions и страницах.
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { tasks, topics, type Exam, type Subject, type TaskStatus } from "@/db/schema";
import type { ExistingState } from "./plan";
import { maxScore, type ImportFile } from "./schema";

export async function loadExistingState(): Promise<ExistingState> {
  const [topicRows, taskRows] = await Promise.all([
    db.select({ code: topics.code, subject: topics.subject }).from(topics),
    db.select({ code: tasks.code }).from(tasks),
  ]);
  return {
    topics: new Map(topicRows.map((t) => [t.code, t.subject])),
    taskCodes: new Set(taskRows.map((t) => t.code)),
  };
}

// Записывает проверенный файл одной транзакцией: всё или ничего
export async function applyImport(file: ImportFile, userId: string) {
  await db.transaction(async (tx) => {
    for (const t of file.topics ?? []) {
      await tx
        .insert(topics)
        .values(t)
        .onConflictDoUpdate({
          target: topics.code,
          set: { section: t.section, name: t.name },
        });
    }

    const topicRows = await tx.select({ id: topics.id, code: topics.code }).from(topics);
    const topicId = new Map(topicRows.map((t) => [t.code, t.id]));

    for (const t of file.tasks ?? []) {
      const values = {
        subject: t.subject,
        grade: t.grade,
        topicId: topicId.get(t.topic)!,
        exam: t.exam ?? null,
        examTaskNumber: t.examTaskNumber ?? null,
        examPart: t.examPart ?? null,
        difficulty: t.difficulty,
        statement: t.statement,
        answerType: t.answer.type,
        answer: t.answer,
        solution: t.solution ?? null,
        criteria: t.criteria ?? null,
        maxScore: maxScore(t.criteria),
        updatedAt: new Date(),
        updatedBy: userId,
      };
      await tx
        .insert(tasks)
        .values({ ...values, code: t.code, status: t.status ?? "draft" })
        .onConflictDoUpdate({
          target: tasks.code,
          // Без status в файле статус существующей задачи не меняется
          set: t.status ? { ...values, status: t.status } : values,
        });
    }
  });
}

export type TaskFilters = {
  subject?: Subject;
  grade?: number;
  exam?: Exam;
  topicId?: string;
  status?: TaskStatus;
};

export async function listTasks(filters: TaskFilters) {
  const conditions: SQL[] = [];
  if (filters.subject) conditions.push(eq(tasks.subject, filters.subject));
  if (filters.grade) conditions.push(eq(tasks.grade, filters.grade));
  if (filters.exam) conditions.push(eq(tasks.exam, filters.exam));
  if (filters.topicId) conditions.push(eq(tasks.topicId, filters.topicId));
  if (filters.status) conditions.push(eq(tasks.status, filters.status));

  return db
    .select({
      id: tasks.id,
      code: tasks.code,
      subject: tasks.subject,
      grade: tasks.grade,
      exam: tasks.exam,
      examTaskNumber: tasks.examTaskNumber,
      difficulty: tasks.difficulty,
      status: tasks.status,
      answerType: tasks.answerType,
      // Начало условия для списка
      preview: sql<string>`left(${tasks.statement}, 120)`,
      topicSection: topics.section,
      topicName: topics.name,
    })
    .from(tasks)
    .innerJoin(topics, eq(topics.id, tasks.topicId))
    .where(and(...conditions))
    .orderBy(asc(tasks.subject), asc(tasks.grade), asc(tasks.code));
}

export async function listTopics() {
  return db
    .select()
    .from(topics)
    .orderBy(asc(topics.subject), asc(topics.section), asc(topics.name));
}

export async function getTask(id: string) {
  const [row] = await db
    .select({ task: tasks, topic: topics })
    .from(tasks)
    .innerJoin(topics, eq(topics.id, tasks.topicId))
    .where(eq(tasks.id, id));
  return row ?? null;
}

export async function setTaskStatus(id: string, status: TaskStatus, userId: string) {
  await db
    .update(tasks)
    .set({ status, updatedAt: new Date(), updatedBy: userId })
    .where(eq(tasks.id, id));
}
