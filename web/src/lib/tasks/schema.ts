// Схема файла импорта задач. Описание формата - docs/task-schema.md.
import { z } from "@/lib/zod";

const code = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,63}$/, "Код: 2-64 символа, строчные латинские буквы, цифры, точка, дефис, подчёркивание");

const nonEmptyText = z.string().trim().min(1, "Не может быть пустым");

export const subjectSchema = z.enum(["math", "physics"]);

// Формула для SymPy: только "калькуляторные" символы и парные скобки
export const formula = z
  .string()
  .trim()
  .min(1, "Пустая формула")
  .max(500)
  .refine((s) => !s.includes("^"), "Степень пишется через **, например x**2")
  .refine((s) => !/[=<>]/.test(s), "В ответе не должно быть знаков =, <, >")
  .refine(
    (s) => /^[0-9A-Za-z_+\-*/().,\s]+$/.test(s),
    "Недопустимые символы. Можно: цифры, латиница, + - * / ( ) , .",
  )
  .refine(balancedParens, "Скобки не сбалансированы");

function balancedParens(s: string): boolean {
  let depth = 0;
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

// Промежуток: "(-oo; -1] U (2; 5)" или "{3}"
const INTERVAL_PART = /^([[(])\s*(.+?)\s*;\s*(.+?)\s*([\])])$/;
const POINT_PART = /^\{\s*(.+?)\s*\}$/;

export function intervalError(value: string): string | null {
  const parts = value.split(/\s+U\s+/);
  for (const part of parts.map((p) => p.trim())) {
    const point = POINT_PART.exec(part);
    if (point) {
      if (!formula.safeParse(point[1]).success) return `Неверная точка: ${part}`;
      continue;
    }
    const m = INTERVAL_PART.exec(part);
    if (!m) return `Не удалось разобрать промежуток "${part}". Пример: (-oo; -1] U (2; 5)`;
    const [, open, left, right, close] = m;
    if (left === "+oo" || left === "oo") return `Левый конец не может быть +oo: ${part}`;
    if (right === "-oo") return `Правый конец не может быть -oo: ${part}`;
    if (left === "-oo" && open !== "(") return `У -oo скобка всегда круглая: ${part}`;
    if ((right === "+oo" || right === "oo") && close !== ")") {
      return `У +oo скобка всегда круглая: ${part}`;
    }
    for (const end of [left, right]) {
      if (/^[+-]?oo$/.test(end)) continue;
      if (!formula.safeParse(end).success) return `Неверный конец "${end}" в ${part}`;
    }
  }
  return null;
}

const tolerances = {
  tolerance: z.number().min(0).optional(),
  relativeTolerance: z.number().min(0).lt(1).optional(),
};
const oneTolerance = (a: { tolerance?: number; relativeTolerance?: number }) =>
  a.tolerance === undefined || a.relativeTolerance === undefined;
const oneToleranceMessage = {
  message: "Укажите что-то одно: tolerance или relativeTolerance",
};

const numberAnswer = z
  .strictObject({ type: z.literal("number"), value: z.number(), ...tolerances })
  .refine(oneTolerance, oneToleranceMessage);

const expressionAnswer = z.strictObject({ type: z.literal("expression"), value: formula });

const rootsAnswer = z.strictObject({
  type: z.literal("roots"),
  values: z.array(formula).max(20),
});

const intervalAnswer = z.strictObject({
  type: z.literal("interval"),
  value: z
    .string()
    .trim()
    .min(1)
    .superRefine((v, ctx) => {
      const error = intervalError(v);
      if (error) ctx.addIssue({ code: "custom", message: error });
    }),
});

const tupleAnswer = z.strictObject({
  type: z.literal("tuple"),
  values: z.array(formula).min(2, "В наборе должно быть хотя бы 2 значения").max(20),
});

const quantityAnswer = z
  .strictObject({
    type: z.literal("quantity"),
    value: z.number(),
    unit: z
      .string()
      .trim()
      .regex(
        /^(1|[A-Za-z]+(\*\*-?\d+)?)([*/][A-Za-z]+(\*\*-?\d+)?)*$/,
        "Единицы латиницей в записи SymPy, например m/s**2 или kg*m/s",
      ),
    ...tolerances,
  })
  .refine(oneTolerance, oneToleranceMessage);

const digitsAnswer = z.strictObject({
  type: z.literal("digits"),
  value: z.string().regex(/^\d{1,20}$/, "Только цифры, от 1 до 20"),
  ordered: z.boolean().optional(),
});

// Итоговый ответ решения по шагам - любой тип, кроме steps
export const finalAnswerSchema = z.discriminatedUnion("type", [
  numberAnswer,
  expressionAnswer,
  rootsAnswer,
  intervalAnswer,
  tupleAnswer,
  quantityAnswer,
  digitsAnswer,
]);

const stepsAnswer = z.strictObject({
  type: z.literal("steps"),
  final: finalAnswerSchema.optional(),
});

export const answerSchema = z.discriminatedUnion("type", [
  numberAnswer,
  expressionAnswer,
  rootsAnswer,
  intervalAnswer,
  tupleAnswer,
  quantityAnswer,
  digitsAnswer,
  stepsAnswer,
]);

export type Answer = z.infer<typeof answerSchema>;

export const criterionSchema = z.strictObject({
  points: z.number().int().min(0).max(20),
  description: nonEmptyText,
});

// Какие экзамены бывают у какого предмета
export const EXAMS_BY_SUBJECT = {
  math: ["oge", "ege_base", "ege_profile"],
  physics: ["oge", "ege"],
} as const;

export const topicSchema = z.strictObject({
  code,
  subject: subjectSchema,
  section: nonEmptyText.max(100),
  name: nonEmptyText.max(200),
});

export const taskSchema = z
  .strictObject({
    code,
    subject: subjectSchema,
    grade: z.union([z.literal(9), z.literal(10), z.literal(11)], {
      message: "Класс: 9, 10 или 11",
    }),
    topic: code,
    exam: z.enum(["oge", "ege_base", "ege_profile", "ege"]).optional(),
    examTaskNumber: z.number().int().min(1).max(30).optional(),
    examPart: z.union([z.literal(1), z.literal(2)], { message: "Часть: 1 или 2" }).optional(),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)], {
      message: "Сложность: 1, 2 или 3",
    }),
    status: z.enum(["draft", "published", "archived"]).optional(),
    statement: nonEmptyText.max(20000),
    answer: answerSchema,
    solution: nonEmptyText.max(50000).optional(),
    criteria: z.array(criterionSchema).min(1).max(10).optional(),
  })
  .superRefine((task, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (task.exam && !(EXAMS_BY_SUBJECT[task.subject] as readonly string[]).includes(task.exam)) {
      issue("exam", `Экзамен ${task.exam} не бывает по предмету ${task.subject}`);
    }
    if (!task.exam && task.examTaskNumber !== undefined) {
      issue("examTaskNumber", "Номер задания указывается только вместе с exam");
    }
    if (!task.exam && task.examPart !== undefined) {
      issue("examPart", "Часть указывается только вместе с exam");
    }
    if (task.examPart === 2 && !task.criteria) {
      issue("criteria", "Для части 2 нужны критерии оценивания");
    }
  });

export type TopicInput = z.infer<typeof topicSchema>;
export type TaskInput = z.infer<typeof taskSchema>;

export const importFileSchema = z.strictObject({
  topics: z.array(topicSchema).max(1000).optional(),
  tasks: z.array(taskSchema).max(2000).optional(),
});

export type ImportFile = z.infer<typeof importFileSchema>;

export function maxScore(criteria: { points: number }[] | undefined): number | null {
  return criteria ? Math.max(...criteria.map((c) => c.points)) : null;
}
