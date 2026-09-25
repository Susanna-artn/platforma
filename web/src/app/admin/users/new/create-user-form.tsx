"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createUserAction, type CreateUserState } from "../actions";

const inputClass = "rounded border border-gray-300 px-3 py-2";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm">{label}</span>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

// Новый key пересоздаёт форму с чистым состоянием - так работает "Создать ещё"
export function CreateUserSection() {
  const [formKey, setFormKey] = useState(0);
  return <CreateUserForm key={formKey} onDone={() => setFormKey((k) => k + 1)} />;
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(
    createUserAction,
    {},
  );
  const [role, setRole] = useState("student");

  if (state.created) {
    return (
      <div className="rounded border border-green-300 bg-green-50 p-4">
        <p className="mb-2 font-semibold">Пользователь создан</p>
        <p>
          Логин: <span className="font-mono">{state.created.login}</span>
        </p>
        <p>
          Пароль: <span className="font-mono">{state.created.password}</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Запишите пароль и передайте его. Больше он показан не будет, но его можно
          сбросить в карточке пользователя.
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <Link href={`/admin/users/${state.created.id}`} className="text-blue-600 hover:underline">
            Открыть карточку
          </Link>
          <button type="button" onClick={onDone} className="text-blue-600 hover:underline">
            Создать ещё
          </button>
        </div>
      </div>
    );
  }

  const e = state.errors ?? {};
  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <Field label="Роль" error={e.role}>
        <select
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className={inputClass}
        >
          <option value="student">Ученик</option>
          <option value="parent">Родитель</option>
          <option value="teacher">Преподаватель</option>
        </select>
      </Field>
      <Field label="Логин (латиницей, например ivan.p)" error={e.login}>
        <input name="login" required autoCapitalize="none" className={inputClass} />
      </Field>
      <Field label="Имя" error={e.firstName}>
        <input name="firstName" required className={inputClass} />
      </Field>
      <Field label="Первая буква фамилии" error={e.lastInitial}>
        <input name="lastInitial" required maxLength={1} className={`${inputClass} w-16`} />
      </Field>
      {role === "student" && (
        <Field label="Класс" error={e.grade}>
          <select name="grade" defaultValue="9" className={`${inputClass} w-24`}>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
          </select>
        </Field>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Создаём..." : "Создать"}
      </button>
    </form>
  );
}
