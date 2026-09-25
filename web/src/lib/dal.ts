// Слой доступа к данным: здесь проверяется, кто делает запрос.
// Сессия в cookie говорит только "кто вошёл". Актуальные данные
// (активен ли аккаунт, роль, согласие) всегда читаем из базы.
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { studentProfiles, users, type Role } from "@/db/schema";
import { ROLE_HOME } from "@/lib/access";

export type CurrentUser = {
  id: string;
  login: string;
  role: Role;
  firstName: string;
  lastInitial: string;
};

// cache: в пределах одного запроса к базе обращаемся один раз
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      login: true,
      role: true,
      firstName: true,
      lastInitial: true,
      isActive: true,
      sessionVersion: true,
    },
  });
  // Аккаунт заблокирован или пароль сброшен после входа - сессия недействительна
  if (!user || !user.isActive || user.sessionVersion !== session.user.sessionVersion) {
    return null;
  }
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    firstName: user.firstName,
    lastInitial: user.lastInitial,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}

export async function getStudentProfile(userId: string) {
  return db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
    columns: { grade: true, parentConsentAt: true },
  });
}
