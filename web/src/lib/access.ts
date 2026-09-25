// Правила доступа по ролям. Чистые функции без базы - их легко тестировать.
import type { Role } from "@/db/schema";

// Раздел сайта, который принадлежит каждой роли
export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/users",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const SECTION_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/student", roles: ["student"] },
  { prefix: "/parent", roles: ["parent"] },
];

// Какие роли могут открыть путь. null - путь не закрыт ролями (например, /login).
export function rolesForPath(pathname: string): Role[] | null {
  const section = SECTION_ROLES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  return section ? section.roles : null;
}

export function canAccessPath(role: Role, pathname: string): boolean {
  const roles = rolesForPath(pathname);
  return roles === null || roles.includes(role);
}

// На этапе 1 пользователями управляет только admin (см. docs/decisions.md)
export function canManageUsers(role: Role): boolean {
  return role === "admin";
}

// Ученик работает только после отметки о согласии родителя
export function studentCanWork(parentConsentAt: Date | null): boolean {
  return parentConsentAt !== null;
}
