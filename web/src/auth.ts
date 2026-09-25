import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

declare module "next-auth" {
  interface User {
    role: Role;
    sessionVersion: number;
  }
  interface Session {
    user: { id: string; role: Role; sessionVersion: number } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    sessionVersion: number;
  }
}

const credentialsSchema = z.object({
  login: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(1).max(200),
});

// Хэш для случая "логин не найден": проверяем пароль и тогда, чтобы
// по времени ответа нельзя было понять, существует ли такой логин
const dummyHashPromise = hashPassword("dummy-password-for-timing");

export const { handlers, auth, signIn, signOut } = NextAuth({
  // С входом по паролю Auth.js хранит сессию только в подписанной cookie (JWT)
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { login: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { login, password } = parsed.data;

        const user = await db.query.users.findFirst({ where: eq(users.login, login) });
        if (!user) {
          await verifyPassword(await dummyHashPromise, password);
          return null;
        }
        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok || !user.isActive) return null;

        return {
          id: user.id,
          name: user.firstName,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // user есть только в момент входа
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.sessionVersion = token.sessionVersion;
      return session;
    },
  },
});
