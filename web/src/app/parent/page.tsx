import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";

export default async function ParentPage() {
  const user = await requireRole("parent");

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-2xl p-6">
        <h1 className="mb-2 text-xl font-semibold">Прогресс ребёнка</h1>
        <p className="text-gray-600">Здесь появится прогресс вашего ребёнка.</p>
      </main>
    </>
  );
}
