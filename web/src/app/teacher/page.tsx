import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";

export default async function TeacherPage() {
  const user = await requireRole("teacher");

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-2xl p-6">
        <h1 className="mb-2 text-xl font-semibold">Кабинет преподавателя</h1>
        <p className="text-gray-600">Группы, задания и история ошибок учеников появятся здесь позже.</p>
      </main>
    </>
  );
}
