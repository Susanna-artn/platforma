import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/dal";
import { CreateUserSection } from "./create-user-form";

export default async function NewUserPage() {
  const admin = await requireRole("admin");

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-5xl p-6">
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          Все пользователи
        </Link>
        <h1 className="mb-4 mt-2 text-xl font-semibold">Новый пользователь</h1>
        <CreateUserSection />
      </main>
    </>
  );
}
