"use client";

import { useActionState } from "react";
import { uploadMediaAction, type UploadState } from "./actions";

export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadMediaAction, {});

  return (
    <form action={action} className="mb-6 flex flex-col gap-3">
      <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Загружаем..." : "Загрузить"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.fileName && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">
          Загружено. Вставьте в условие или решение:{" "}
          <code className="select-all font-mono">![описание](/media/{state.fileName})</code>
        </p>
      )}
    </form>
  );
}
