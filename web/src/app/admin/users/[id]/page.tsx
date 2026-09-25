import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";
import { formatDate, ROLE_TITLE, shortName, todayIso } from "@/lib/format";
import { getUserDetails, listLinks, listUsers } from "@/lib/users";
import { revokeConsentAction, setActiveAction, unlinkParentAction } from "../actions";
import { ConsentForm, LinkForm, ResetPasswordForm } from "./forms";

const linkButton = "text-sm text-blue-600 hover:underline";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 py-4">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function UserPage(props: PageProps<"/admin/users/[id]">) {
  const admin = await requireRole("admin");
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await getUserDetails(id);
  if (!user) notFound();

  const isStudent = user.role === "student";
  const isParent = user.role === "parent";
  const links = isStudent || isParent ? await listLinks([user.id]) : [];

  // Кого можно привязать: все родители (для ученика) или все ученики (для родителя),
  // кроме уже привязанных
  const linkedIds = new Set(links.map((l) => (isStudent ? l.parentId : l.studentId)));
  const candidates =
    isStudent || isParent
      ? (await listUsers(isStudent ? "parent" : "student"))
          .filter((u) => !linkedIds.has(u.id))
          .map((u) => ({ id: u.id, name: `${shortName(u)} (${u.login})` }))
      : [];

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-3xl p-6">
        <Link href="/admin/users" className={linkButton}>
          Все пользователи
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{shortName(user)}</h1>
        <p className="mb-4 text-sm text-gray-600">
          {ROLE_TITLE[user.role]}
          {isStudent && `, ${user.grade} класс`} - логин{" "}
          <span className="font-mono">{user.login}</span>
          {!user.isActive && <span className="text-red-600"> - заблокирован</span>}
        </p>

        {isStudent && (
          <Section title="Согласие родителя">
            {user.parentConsentAt ? (
              <div className="flex items-center gap-4">
                <span>Получено {formatDate(user.parentConsentAt)}</span>
                <form action={revokeConsentAction}>
                  <input type="hidden" name="id" value={user.id} />
                  <button type="submit" className={linkButton}>
                    Снять отметку
                  </button>
                </form>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm text-red-600">
                  Нет. Пока согласия нет, ученик не может заниматься.
                </p>
                <ConsentForm id={user.id} today={todayIso()} />
              </>
            )}
          </Section>
        )}

        {(isStudent || isParent) && (
          <Section title={isStudent ? "Родители" : "Дети"}>
            {links.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1">
                {links.map((l) => (
                  <li key={`${l.parentId}-${l.studentId}`} className="flex items-center gap-4">
                    <Link
                      href={`/admin/users/${isStudent ? l.parentId : l.studentId}`}
                      className="hover:underline"
                    >
                      {isStudent ? l.parentName : l.studentName}
                    </Link>
                    <form action={unlinkParentAction}>
                      <input type="hidden" name="parentId" value={l.parentId} />
                      <input type="hidden" name="studentId" value={l.studentId} />
                      <button type="submit" className={linkButton}>
                        Отвязать
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <LinkForm
              fixedName={isStudent ? "studentId" : "parentId"}
              fixedId={user.id}
              optionsAre={isStudent ? "parentId" : "studentId"}
              options={candidates}
            />
          </Section>
        )}

        <Section title="Пароль">
          <ResetPasswordForm id={user.id} />
        </Section>

        {user.id !== admin.id && (
          <Section title="Доступ">
            <form action={setActiveAction}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="active" value={user.isActive ? "false" : "true"} />
              <button type="submit" className={linkButton}>
                {user.isActive ? "Заблокировать" : "Разблокировать"}
              </button>
            </form>
          </Section>
        )}
      </main>
    </>
  );
}
