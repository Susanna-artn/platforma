import { logout } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/dal";

const ROLE_TITLE = {
  admin: "Администратор",
  teacher: "Преподаватель",
  student: "Ученик",
  parent: "Родитель",
} as const;

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
      <span className="font-semibold">Подготовка по математике и физике</span>
      <div className="flex items-center gap-4 text-sm">
        <span>
          {user.firstName} {user.lastInitial}. - {ROLE_TITLE[user.role]}
        </span>
        <form action={logout}>
          <button type="submit" className="text-blue-600 hover:underline">
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
