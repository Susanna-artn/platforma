import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Subject } from "@/db/schema";
import { planImport, type ExistingState } from "./plan";

const example = readFileSync(
  path.resolve(import.meta.dirname, "../../../../docs/examples/tasks-example.json"),
  "utf8",
);

const empty: ExistingState = { topics: new Map(), taskCodes: new Set(), mediaNames: new Set() };

const topic = { code: "m.alg.quadratic", subject: "math", section: "Алгебра", name: "Квадратные" };
const task = {
  code: "t-1",
  subject: "math",
  grade: 9,
  topic: "m.alg.quadratic",
  difficulty: 1,
  statement: "Решите $x^2 = 4$.",
  answer: { type: "roots", values: ["-2", "2"] },
};

function plan(file: unknown, existing = empty) {
  return planImport(JSON.stringify(file), existing).report;
}

function errorsFor(taskPatch: Record<string, unknown>) {
  return plan({ topics: [topic], tasks: [{ ...task, ...taskPatch }] }).errors;
}

describe("пример из docs/examples", () => {
  it("проходит проверку без ошибок", () => {
    const { report, file } = planImport(example, empty);
    expect(report.errors).toEqual([]);
    expect(file?.tasks).toHaveLength(9);
    expect(report.newTopics).toHaveLength(9);
    expect(report.newTasks).toHaveLength(9);
  });

  it("при повторном импорте всё помечено как обновление", () => {
    const { file } = planImport(example, empty);
    const existing: ExistingState = {
      topics: new Map(file!.topics!.map((t) => [t.code, t.subject])),
      taskCodes: new Set(file!.tasks!.map((t) => t.code)),
      mediaNames: new Set(),
    };
    const report = planImport(example, existing).report;
    expect(report.newTasks).toEqual([]);
    expect(report.updatedTasks).toHaveLength(9);
  });
});

describe("ошибки файла", () => {
  it("не JSON", () => {
    expect(planImport("{oops", empty).report.errors[0]).toMatch(/не корректный JSON/);
  });

  it("пустой файл", () => {
    expect(plan({}).errors).toContain("В файле нет ни тем, ни задач");
  });

  it("опечатка в имени поля ловится, а ошибка называет задачу", () => {
    const [error] = errorsFor({ statment: "x" });
    expect(error).toMatch(/^Задача №1 \(t-1\)/);
    expect(error).toMatch(/statment/);
  });

  it("неизвестная тема", () => {
    expect(errorsFor({ topic: "m.nope" })[0]).toMatch(/темы m\.nope нет/);
  });

  it("тема из базы подходит", () => {
    const existing: ExistingState = {
      topics: new Map<string, Subject>([["m.alg.quadratic", "math"]]),
      taskCodes: new Set(),
      mediaNames: new Set(),
    };
    expect(plan({ tasks: [task] }, existing).errors).toEqual([]);
  });

  it("тема другого предмета", () => {
    expect(errorsFor({ subject: "physics" })[0]).toMatch(/другому предмету/);
  });

  it("нельзя поменять предмет существующей темы", () => {
    const existing: ExistingState = {
      topics: new Map<string, Subject>([["m.alg.quadratic", "physics"]]),
      taskCodes: new Set(),
      mediaNames: new Set(),
    };
    expect(plan({ topics: [topic] }, existing).errors[0]).toMatch(/предмет существующей темы/);
  });

  it("повтор кода задачи в файле", () => {
    expect(plan({ topics: [topic], tasks: [task, task] }).errors).toContain(
      "Задача t-1 встречается в файле несколько раз",
    );
  });

  it("класс и сложность вне диапазона", () => {
    expect(errorsFor({ grade: 8 }).join()).toMatch(/Класс: 9, 10 или 11/);
    expect(errorsFor({ difficulty: 4 }).join()).toMatch(/Сложность: 1, 2 или 3/);
  });
});

describe("экзамен", () => {
  it("ЕГЭ база только по математике", () => {
    const physicsTopic = { ...topic, code: "p.x", subject: "physics" };
    const errors = plan({
      topics: [physicsTopic],
      tasks: [{ ...task, subject: "physics", topic: "p.x", exam: "ege_base" }],
    }).errors;
    expect(errors.join()).toMatch(/не бывает по предмету physics/);
  });

  it("номер задания без экзамена - ошибка", () => {
    expect(errorsFor({ examTaskNumber: 5 }).join()).toMatch(/только вместе с exam/);
  });

  it("часть 2 без критериев - ошибка", () => {
    expect(errorsFor({ exam: "oge", examPart: 2 }).join()).toMatch(/нужны критерии/);
  });
});

describe("ответы", () => {
  const ok = (answer: unknown) => expect(errorsFor({ answer })).toEqual([]);
  const bad = (answer: unknown, pattern: RegExp) =>
    expect(errorsFor({ answer }).join("\n")).toMatch(pattern);

  it("number", () => {
    ok({ type: "number", value: 2.5, tolerance: 0.01 });
    bad({ type: "number", value: "2.5" }, /answer\.value/);
    bad({ type: "number", value: 1, tolerance: 0.1, relativeTolerance: 0.1 }, /что-то одно/);
  });

  it("expression", () => {
    ok({ type: "expression", value: "sqrt(2)/2 + x**2" });
    bad({ type: "expression", value: "x^2" }, /через \*\*/);
    bad({ type: "expression", value: "(x + 1" }, /Скобки/);
    bad({ type: "expression", value: "x = 1" }, /знаков =/);
    bad({ type: "expression", value: "\\frac{1}{2}" }, /Недопустимые символы/);
  });

  it("roots: пустой список - корней нет", () => {
    ok({ type: "roots", values: [] });
  });

  it("interval", () => {
    ok({ type: "interval", value: "(-oo; -1] U (2; 5) U {7}" });
    ok({ type: "interval", value: "[sqrt(2); +oo)" });
    bad({ type: "interval", value: "[-oo; 1)" }, /скобка всегда круглая/);
    bad({ type: "interval", value: "(1, 2)" }, /Не удалось разобрать/);
  });

  it("tuple", () => {
    ok({ type: "tuple", values: ["1", "-2"] });
    bad({ type: "tuple", values: ["1"] }, /хотя бы 2/);
  });

  it("quantity", () => {
    ok({ type: "quantity", value: 9.8, unit: "m/s**2", relativeTolerance: 0.02 });
    ok({ type: "quantity", value: 5, unit: "kg*m/s" });
    bad({ type: "quantity", value: 5, unit: "м/с" }, /Единицы латиницей/);
    bad({ type: "quantity", value: 5 }, /answer\.unit/);
  });

  it("digits", () => {
    ok({ type: "digits", value: "0312", ordered: false });
    bad({ type: "digits", value: "3 1" }, /Только цифры/);
  });

  it("steps", () => {
    ok({ type: "steps" });
    ok({ type: "steps", final: { type: "number", value: 1 } });
    bad({ type: "steps", final: { type: "steps" } }, /answer\.final/);
  });

  it("неизвестный тип", () => {
    bad({ type: "matrix", value: "1" }, /answer\.type/);
  });
});

describe("картинки в задачах", () => {
  const img = "a".repeat(32) + ".png";

  it("загруженная картинка подходит", () => {
    const existing = { ...empty, mediaNames: new Set([img]) };
    const file = { topics: [topic], tasks: [{ ...task, statement: `Рис.: ![схема](/media/${img})` }] };
    expect(plan(file, existing).errors).toEqual([]);
  });

  it("незагруженная картинка - ошибка", () => {
    expect(errorsFor({ solution: `![](/media/${img})` })[0]).toMatch(/не загружена/);
  });

  it("картинка с чужого сайта - ошибка", () => {
    expect(errorsFor({ statement: "![](https://example.com/a.png)" })[0]).toMatch(
      /не из нашего хранилища/,
    );
  });
});
