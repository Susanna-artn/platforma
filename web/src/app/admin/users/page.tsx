import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { roleEnum, type Role } from "@/db/schema";
import { requireRole } from "@/lib/dal";
import { formatDate, ROLE_TITLE, shortName } from "@/lib/format";
import { listLinks, listUsers } from "@/lib/users";

const FILTERS: { role?: Role; title: string }[] = [
  { title: "Все" },
  { role: "student", title: "Ученики" },
  { role: "parent", title: "Родители" },
  { role: "teacher", title: "Преподаватели" },
  { role: "admin", title: "Администраторы" },
];

export default async function UsersPage(props: PageProps<"/admin/users">) {
  const admin = await requireRole("admin");
  const { role: rawRole } = await props.searchParams;
  const role = roleEnum.enumValues.find((r) => r === rawRole);

  const list = await listUsers(role);
  const links = await listLinks(list.map((u) => u.id));

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Пользователи</h1>
          <Link
            href="/admin/users/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Создать пользователя
          </Link>
        </div>

        <nav className="mb-4 flex gap-2 text-sm">
          {FILTERS.map((f) => (
            <Link
              key={f.title}
              href={f.role ? `/admin/users?role=${f.role}` : "/admin/users"}
              className={`rounded px-3 py-1 ${
                f.role === role ? "bg-gray-800 text-white" : "bg-gray-100"
              }`}
            >
              {f.title}
            </Link>
          ))}
        </nav>

        {list.length === 0 ? (
          <p className="text-gray-600">Пока никого нет.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-300 text-gray-500">
              <tr>
                <th className="py-2 pr-4">Имя</th>
                <th className="py-2 pr-4">Логин</th>
                <th className="py-2 pr-4">Роль</th>
                <th className="py-2 pr-4">Класс</th>
                <th className="py-2 pr-4">Согласие родителя</th>
                <th className="py-2 pr-4">Связи</th>
                <th className="py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const related = links
                  .filter((l) => l.parentId === u.id || l.studentId === u.id)
                  .map((l) => (l.parentId === u.id ? l.studentName : l.parentName));
                return (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <Link href={`/admin/users/${u.id}`} className="text-blue-600 hover:underline">
                        {shortName(u)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono">{u.login}</td>
                    <td className="py-2 pr-4">{ROLE_TITLE[u.role]}</td>
                    <td className="py-2 pr-4">{u.grade ?? ""}</td>
                    <td className="py-2 pr-4">
                      {u.role === "student" &&
                        (u.parentConsentAt ? (
                          formatDate(u.parentConsentAt)
                        ) : (
                          <span className="text-red-600">нет</span>
                        ))}
                    </td>
                    <td className="py-2 pr-4">{related.join(", ")}</td>
                    <td className="py-2">
                      {u.isActive ? "активен" : <span className="text-gray-400">заблокирован</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
