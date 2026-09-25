"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ImportReport } from "@/lib/tasks/plan";
import { importTasksAction, type ImportState } from "../actions";

function CodeList({ title, codes }: { title: string; codes: string[] }) {
  if (codes.length === 0) return null;
  return (
    <div>
      <p className="font-medium">
        {title}: {codes.length}
      </p>
      <p className="font-mono text-xs text-gray-600">{codes.join(", ")}</p>
    </div>
  );
}

function Report({ report }: { report: ImportReport }) {
  if (report.errors.length > 0) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4">
        <p className="mb-2 font-semibold">
          Ошибок: {report.errors.length}. Ничего не импортировано.
        </p>
        <ul className="list-disc pl-5 text-sm">
          {report.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded border border-gray-300 p-4 text-sm">
      <CodeList title="Новые темы (проверьте, нет ли опечаток)" codes={report.newTopics} />
      <CodeList title="Обновятся темы" codes={report.updatedTopics} />
      <CodeList title="Новые задачи" codes={report.newTasks} />
      <CodeList title="Обновятся задачи" codes={report.updatedTasks} />
    </div>
  );
}

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importTasksAction, {});
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  // Отчёт относится к последнему проверенному тексту
  const [checkedText, setCheckedText] = useState<string | null>(null);

  const canImport =
    !pending && checkedText === text && state.report?.errors.length === 0 && !state.imported;

  return (
    <div className="flex flex-col gap-4">
      <form
        action={(formData) => {
          setCheckedText(text);
          return action(formData);
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm">Файл JSON (формат - docs/task-schema.md)</span>
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              setFileName(file?.name ?? "");
              setText(file ? await file.text() : "");
            }}
          />
        </label>
        <input type="hidden" name="text" value={text} />
        <div className="flex gap-3">
          <button
            type="submit"
            name="mode"
            value="check"
            disabled={pending || !text}
            className="rounded border border-blue-600 px-4 py-2 text-blue-600 disabled:opacity-50"
          >
            Проверить
          </button>
          <button
            type="submit"
            name="mode"
            value="import"
            disabled={!canImport}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Импортировать
          </button>
        </div>
      </form>

      {pending && <p className="text-sm text-gray-500">Обрабатываем {fileName}...</p>}
      {!pending && state.imported && (
        <p className="rounded border border-green-300 bg-green-50 p-4">
          Импорт выполнен.{" "}
          <Link href="/admin/tasks" className="text-blue-600 hover:underline">
            Открыть банк задач
          </Link>
        </p>
      )}
      {!pending && state.report && checkedText === text && <Report report={state.report} />}
    </div>
  );
}
