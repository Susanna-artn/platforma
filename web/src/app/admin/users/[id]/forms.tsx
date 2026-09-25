"use client";

import { useActionState } from "react";
import {
  linkParentAction,
  resetPasswordAction,
  setConsentAction,
  type FormState,
  type ResetPasswordState,
} from "../actions";

const buttonClass = "rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50";
const inputClass = "rounded border border-gray-300 px-2 py-1 text-sm";

export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    {},
  );
  if (state.password) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">
        Новый пароль: <span className="font-mono">{state.password}</span>
        <br />
        Запишите его, больше он показан не будет. Старый пароль и все входы
        на других устройствах больше не действуют.
      </p>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={buttonClass}>
        Сбросить пароль
      </button>
    </form>
  );
}

export function ConsentForm({ id, today }: { id: string; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setConsentAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="text-sm">
        Дата согласия{" "}
        <input type="date" name="date" defaultValue={today} max={today} className={inputClass} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass}>
        Отметить согласие
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}

export function LinkForm({
  fixedName,
  fixedId,
  options,
  optionsAre,
}: {
  fixedName: "parentId" | "studentId";
  fixedId: string;
  options: { id: string; name: string }[];
  optionsAre: "parentId" | "studentId";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(linkParentAction, {});
  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {optionsAre === "parentId"
          ? "Некого привязать: нет других родителей. Создайте родителя в списке пользователей."
          : "Некого привязать: нет других учеников."}
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={fixedName} value={fixedId} />
      <select name={optionsAre} className={inputClass}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={buttonClass}>
        Привязать
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
