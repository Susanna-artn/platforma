import Link from "next/link";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";
import {
  DIFFICULTY_TITLE,
  EXAM_TITLE,
  STATUS_TITLE,
  SUBJECT_TITLE,
} from "@/lib/format";
import { listTasks, listTopics } from "@/lib/tasks/repo";

// Неверные значения в адресе просто игнорируются
const filtersSchema = z.object({
  subject: z.enum(["math", "physics"]).optional().catch(undefined),
  grade: z.coerce.number().int().min(9).max(11).optional().catch(undefined),
  exam: z.enum(["oge", "ege_base", "ege_profile", "ege"]).optional().catch(undefined),
  topicId: z.uuid().optional().catch(undefined),
  status: z.enum(["draft", "published", "archived"]).optional().catch(undefined),
});

const selectClass = "rounded border border-gray-300 px-2 py-1";

export default async function TasksPage(props: PageProps<"/admin/tasks">) {
  const admin = await requireRole("admin");
  const params = await props.searchParams;
  const filters = filtersSchema.parse(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v === "" ? undefined : v])),
  );
  const [list, topics] = await Promise.all([listTasks(filters), listTopics()]);

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Банк задач</h1>
          <Link
            href="/admin/tasks/import"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Импорт из JSON
          </Link>
        </div>

        {/* Обычная GET-форма: фильтры попадают в адрес страницы */}
        <form className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <select name="subject" defaultValue={filters.subject ?? ""} className={selectClass}>
            <option value="">Все предметы</option>
            {Object.entries(SUBJECT_TITLE).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
          <select name="grade" defaultValue={filters.grade ?? ""} className={selectClass}>
            <option value="">Все классы</option>
            {[9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g} класс
              </option>
            ))}
          </select>
          <select name="exam" defaultValue={filters.exam ?? ""} className={selectClass}>
            <option value="">Любой экзамен</option>
            {Object.entries(EXAM_TITLE).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
          <select name="topicId" defaultValue={filters.topicId ?? ""} className={selectClass}>
            <option value="">Все темы</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {SUBJECT_TITLE[t.subject]}: {t.section} - {t.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={filters.status ?? ""} className={selectClass}>
            <option value="">Любой статус</option>
            {Object.entries(STATUS_TITLE).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded bg-gray-800 px-3 py-1 text-white">
            Показать
          </button>
          <Link href="/admin/tasks" className="text-blue-600 hover:underline">
            Сбросить
          </Link>
        </form>

        <p className="mb-2 text-sm text-gray-500">Найдено: {list.length}</p>
        {list.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-300 text-gray-500">
              <tr>
                <th className="py-2 pr-3">Код</th>
                <th className="py-2 pr-3">Предмет, класс</th>
                <th className="py-2 pr-3">Тема</th>
                <th className="py-2 pr-3">Экзамен</th>
                <th className="py-2 pr-3">Сложность</th>
                <th className="py-2 pr-3">Условие</th>
                <th className="py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 align-top">
                  <td className="whitespace-nowrap py-2 pr-3 font-mono">
                    <Link href={`/admin/tasks/${t.id}`} className="text-blue-600 hover:underline">
                      {t.code}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    {SUBJECT_TITLE[t.subject]}, {t.grade}
                  </td>
                  <td className="py-2 pr-3">{t.topicName}</td>
                  <td className="py-2 pr-3">
                    {t.exam && EXAM_TITLE[t.exam]}
                    {t.examTaskNumber && ` №${t.examTaskNumber}`}
                  </td>
                  <td className="py-2 pr-3">{DIFFICULTY_TITLE[t.difficulty]}</td>
                  <td className="max-w-md py-2 pr-3 text-gray-600">{t.preview}</td>
                  <td className="py-2">{STATUS_TITLE[t.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
