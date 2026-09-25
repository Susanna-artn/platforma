import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { MathText } from "@/components/math-text";
import type { TaskStatus } from "@/db/schema";
import { requireRole } from "@/lib/dal";
import {
  ANSWER_TYPE_TITLE,
  DIFFICULTY_TITLE,
  EXAM_TITLE,
  STATUS_TITLE,
  SUBJECT_TITLE,
} from "@/lib/format";
import { formatAnswer } from "@/lib/tasks/format-answer";
import { getTask } from "@/lib/tasks/repo";
import type { Answer } from "@/lib/tasks/schema";
import { setTaskStatusAction } from "../actions";

const STATUS_ACTIONS: Record<TaskStatus, { status: TaskStatus; title: string }[]> = {
  draft: [
    { status: "published", title: "Опубликовать" },
    { status: "archived", title: "В архив" },
  ],
  published: [
    { status: "draft", title: "Снять с публикации" },
    { status: "archived", title: "В архив" },
  ],
  archived: [{ status: "draft", title: "Вернуть из архива (черновиком)" }],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 py-4">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function TaskPage(props: PageProps<"/admin/tasks/[id]">) {
  const admin = await requireRole("admin");
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getTask(id);
  if (!row) notFound();
  const { task, topic } = row;

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-3xl p-6">
        <Link href="/admin/tasks" className="text-sm text-blue-600 hover:underline">
          Банк задач
        </Link>
        <h1 className="mt-2 font-mono text-xl font-semibold">{task.code}</h1>
        <p className="mb-4 text-sm text-gray-600">
          {SUBJECT_TITLE[task.subject]}, {task.grade} класс - {topic.section} / {topic.name}
          {task.exam && (
            <>
              {" "}
              - {EXAM_TITLE[task.exam]}
              {task.examTaskNumber && `, задание ${task.examTaskNumber}`}
              {task.examPart && `, часть ${task.examPart}`}
            </>
          )}{" "}
          - уровень {DIFFICULTY_TITLE[task.difficulty]} - {STATUS_TITLE[task.status]}
        </p>

        <div className="mb-4 flex gap-3">
          {STATUS_ACTIONS[task.status].map((a) => (
            <form key={a.status} action={setTaskStatusAction}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="status" value={a.status} />
              <button type="submit" className="rounded border border-gray-400 px-3 py-1 text-sm">
                {a.title}
              </button>
            </form>
          ))}
        </div>

        <Section title="Условие">
          <MathText>{task.statement}</MathText>
        </Section>

        <Section title={`Ответ (${ANSWER_TYPE_TITLE[task.answerType]})`}>
          <p className="font-mono">{formatAnswer(task.answer as Answer)}</p>
        </Section>

        {task.solution && (
          <Section title="Решение">
            <MathText>{task.solution}</MathText>
          </Section>
        )}

        {task.criteria && (
          <Section title={`Критерии (максимум ${task.maxScore})`}>
            <table className="w-full text-sm">
              <tbody>
                {task.criteria.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100 align-top">
                    <td className="w-16 py-2 pr-3 font-semibold">{c.points}</td>
                    <td className="py-2">
                      <MathText>{c.description}</MathText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
      </main>
    </>
  );
}
