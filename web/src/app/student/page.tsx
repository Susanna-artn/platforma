import { AppHeader } from "@/components/app-header";
import { studentCanWork } from "@/lib/access";
import { getStudentProfile, requireRole } from "@/lib/dal";

export default async function StudentPage() {
  const user = await requireRole("student");
  const profile = await getStudentProfile(user.id);
  const canWork = studentCanWork(profile?.parentConsentAt ?? null);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-2xl p-6">
        {canWork ? (
          <>
            <h1 className="mb-2 text-xl font-semibold">Задания</h1>
            <p className="text-gray-600">Здесь появятся твои задания.</p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-xl font-semibold">Ждём согласия родителя</h1>
            <p className="text-gray-600">
              Чтобы начать заниматься, нужно согласие родителя на обработку данных.
              Как только преподаватель его отметит, здесь появятся задания.
            </p>
          </>
        )}
      </main>
    </>
  );
}
