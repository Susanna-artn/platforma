// Быстрая предварительная проверка до загрузки страницы:
// не вошёл - на страницу входа, чужой раздел - в свой раздел.
// Окончательная проверка всегда на сервере в src/lib/dal.ts.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessPath, ROLE_HOME, rolesForPath } from "@/lib/access";

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  if (rolesForPath(pathname) === null) return;

  const user = request.auth?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  if (!canAccessPath(user.role, pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*", "/parent/:path*"],
};
