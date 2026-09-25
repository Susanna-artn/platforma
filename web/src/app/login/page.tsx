import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto mt-24 w-full max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-semibold">Вход</h1>
      <LoginForm />
      <p className="mt-6 text-sm text-gray-500">
        Логин и пароль выдаёт преподаватель. Забыли пароль - напишите ему.
      </p>
    </main>
  );
}
