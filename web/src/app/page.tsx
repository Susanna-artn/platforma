import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/lib/access";
import { requireUser } from "@/lib/dal";

// Главная просто отправляет в раздел своей роли
export default async function Home() {
  const user = await requireUser();
  redirect(ROLE_HOME[user.role]);
}
