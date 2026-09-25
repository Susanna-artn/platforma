import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "teacher", "student", "parent"]);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  // Логин храним в нижнем регистре, чтобы "Ivan" и "ivan" были одним логином
  login: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: roleEnum().notNull(),
  // Персональные данные по минимуму: имя и первая буква фамилии
  firstName: text().notNull(),
  lastInitial: varchar({ length: 1 }).notNull(),
  isActive: boolean().notNull().default(true),
  // Увеличивается при сбросе пароля: все старые сессии перестают действовать
  sessionVersion: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const studentProfiles = pgTable(
  "student_profiles",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    grade: smallint().notNull(),
    // Пока null - согласия родителя нет, ученик работать не может
    parentConsentAt: timestamp({ withTimezone: true }),
    // Кто отметил согласие
    parentConsentMarkedBy: uuid().references(() => users.id),
  },
  (t) => [check("grade_range", sql`${t.grade} between 9 and 11`)],
);

export const parentStudent = pgTable(
  "parent_student",
  {
    parentId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.parentId, t.studentId] })],
);

export const subjectEnum = pgEnum("subject", ["math", "physics"]);
export const examEnum = pgEnum("exam", ["oge", "ege_base", "ege_profile", "ege"]);
export const taskStatusEnum = pgEnum("task_status", ["draft", "published", "archived"]);
export const answerTypeEnum = pgEnum("answer_type", [
  "number",
  "expression",
  "roots",
  "interval",
  "tuple",
  "quantity",
  "digits",
  "steps",
]);

// Справочник тем. Задачи ссылаются на тему, по темам строится история ошибок.
export const topics = pgTable(
  "topics",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    subject: subjectEnum().notNull(),
    section: text().notNull(),
    name: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("topics_subject_idx").on(t.subject, t.section, t.name)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    subject: subjectEnum().notNull(),
    grade: smallint().notNull(),
    // restrict: тему, на которую ссылаются задачи, удалить нельзя
    topicId: uuid()
      .notNull()
      .references(() => topics.id, { onDelete: "restrict" }),
    exam: examEnum(),
    examTaskNumber: smallint(),
    examPart: smallint(),
    difficulty: smallint().notNull(),
    status: taskStatusEnum().notNull().default("draft"),
    // Markdown + LaTeX
    statement: text().notNull(),
    answerType: answerTypeEnum().notNull(),
    // Структура зависит от типа ответа, проверяется в src/lib/tasks/schema.ts
    answer: jsonb().notNull(),
    solution: text(),
    criteria: jsonb().$type<{ points: number; description: string }[]>(),
    maxScore: smallint(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid().references(() => users.id),
  },
  (t) => [
    check("tasks_grade_range", sql`${t.grade} between 9 and 11`),
    check("tasks_difficulty_range", sql`${t.difficulty} between 1 and 3`),
    check("tasks_exam_part", sql`${t.examPart} is null or ${t.examPart} in (1, 2)`),
    check(
      "tasks_exam_fields_need_exam",
      sql`${t.exam} is not null or (${t.examTaskNumber} is null and ${t.examPart} is null)`,
    ),
    index("tasks_filter_idx").on(t.subject, t.grade, t.status),
    index("tasks_topic_idx").on(t.topicId),
  ],
);

// Картинки для задач. Сам файл лежит в MEDIA_DIR под именем fileName
// (хэш содержимого + расширение), здесь - описание.
export const media = pgTable("media", {
  id: uuid().primaryKey().defaultRandom(),
  fileName: text().notNull().unique(),
  originalName: text().notNull(),
  mimeType: text().notNull(),
  sizeBytes: integer().notNull(),
  uploadedBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type Role = (typeof roleEnum.enumValues)[number];
export type Subject = (typeof subjectEnum.enumValues)[number];
export type Exam = (typeof examEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type AnswerType = (typeof answerTypeEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
