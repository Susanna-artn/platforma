// Операции с пользователями. Права доступа проверяются в server actions,
// здесь только работа с базой.
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { parentStudent, studentProfiles, users, type Role } from "@/db/schema";
import { generatePassword, hashPassword } from "@/lib/password";
import type { CreateUserInput } from "@/lib/user-validation";

export class LoginTakenError extends Error {}

const userColumns = {
  id: users.id,
  login: users.login,
  role: users.role,
  firstName: users.firstName,
  lastInitial: users.lastInitial,
  isActive: users.isActive,
  createdAt: users.createdAt,
  grade: studentProfiles.grade,
  parentConsentAt: studentProfiles.parentConsentAt,
};

export async function listUsers(role?: Role) {
  return db
    .select(userColumns)
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(asc(users.role), asc(users.firstName), asc(users.lastInitial));
}

export async function getUserDetails(id: string) {
  const [user] = await db
    .select(userColumns)
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.id, id));
  return user ?? null;
}

// Создаёт пользователя и возвращает сгенерированный пароль (показываем один раз)
export async function createUser(input: CreateUserInput) {
  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  try {
    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          login: input.login,
          passwordHash,
          role: input.role,
          firstName: input.firstName,
          lastInitial: input.lastInitial,
        })
        .returning({ id: users.id, login: users.login });
      if (input.role === "student") {
        await tx.insert(studentProfiles).values({ userId: created.id, grade: input.grade });
      }
      return created;
    });
    return { ...user, password };
  } catch (error) {
    // 23505 - нарушение уникальности (такой логин уже есть)
    if (hasPgCode(error, "23505")) throw new LoginTakenError();
    throw error;
  }
}

function hasPgCode(error: unknown, code: string): boolean {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === code) return true;
  }
  return false;
}

// Новый пароль; старые сессии пользователя перестают действовать
export async function resetPassword(id: string): Promise<string> {
  const password = generatePassword();
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      sessionVersion: sql`${users.sessionVersion} + 1`,
    })
    .where(eq(users.id, id));
  return password;
}

export async function setActive(id: string, isActive: boolean) {
  await db.update(users).set({ isActive }).where(eq(users.id, id));
}

export async function setParentConsent(studentId: string, consentAt: Date | null, markedBy: string) {
  await db
    .update(studentProfiles)
    .set({ parentConsentAt: consentAt, parentConsentMarkedBy: consentAt ? markedBy : null })
    .where(eq(studentProfiles.userId, studentId));
}

// Связи родитель-ребёнок для набора пользователей (для списка и карточки)
export async function listLinks(userIds: string[]) {
  if (userIds.length === 0) return [];
  const parent = db
    .select({ id: users.id, firstName: users.firstName, lastInitial: users.lastInitial })
    .from(users)
    .as("parent");
  const student = db
    .select({ id: users.id, firstName: users.firstName, lastInitial: users.lastInitial })
    .from(users)
    .as("student");
  return db
    .select({
      parentId: parentStudent.parentId,
      studentId: parentStudent.studentId,
      parentName: sql<string>`${parent.firstName} || ' ' || ${parent.lastInitial} || '.'`,
      studentName: sql<string>`${student.firstName} || ' ' || ${student.lastInitial} || '.'`,
    })
    .from(parentStudent)
    .innerJoin(parent, eq(parent.id, parentStudent.parentId))
    .innerJoin(student, eq(student.id, parentStudent.studentId))
    .where(
      sql`${inArray(parentStudent.parentId, userIds)} or ${inArray(parentStudent.studentId, userIds)}`,
    );
}

export async function linkParent(parentId: string, studentId: string) {
  // Проверяем роли обеих сторон, чтобы нельзя было связать, например, двух учеников
  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(inArray(users.id, [parentId, studentId]));
  const roleOf = new Map(rows.map((r) => [r.id, r.role]));
  if (roleOf.get(parentId) !== "parent" || roleOf.get(studentId) !== "student") {
    throw new Error("Связать можно только родителя и ученика");
  }
  await db.insert(parentStudent).values({ parentId, studentId }).onConflictDoNothing();
}

export async function unlinkParent(parentId: string, studentId: string) {
  await db
    .delete(parentStudent)
    .where(and(eq(parentStudent.parentId, parentId), eq(parentStudent.studentId, studentId)));
}
