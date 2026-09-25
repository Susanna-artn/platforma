import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const admin = await requireRole("admin");

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-3xl p-6">
        <Link href="/admin/tasks" className="text-sm text-blue-600 hover:underline">
          Банк задач
        </Link>
        <h1 className="mb-2 mt-2 text-xl font-semibold">Импорт задач</h1>
        <p className="mb-4 text-sm text-gray-600">
          Сначала нажмите «Проверить» и посмотрите отчёт. Импорт записывает файл целиком
          или не записывает ничего. Только собственные задачи.
        </p>
        <ImportForm />
      </main>
    </>
  );
}
