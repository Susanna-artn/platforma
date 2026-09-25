"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { emptyReport, planImport, type ImportReport } from "@/lib/tasks/plan";
import { applyImport, loadExistingState, setTaskStatus } from "@/lib/tasks/repo";

export type ImportState = { report?: ImportReport; imported?: boolean };

const MAX_FILE_CHARS = 4_000_000;

// mode=check - только проверить и показать отчёт; mode=import - проверить и записать
export async function importTasksAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const admin = await requireRole("admin");
  const text = formData.get("text");
  const mode = formData.get("mode");
  if (typeof text !== "string" || text.length === 0) {
    return { report: emptyReport(["Выберите файл"]) };
  }
  if (text.length > MAX_FILE_CHARS) {
    return { report: emptyReport(["Файл слишком большой, разбейте его на части"]) };
  }

  // Проверяем заново даже при импорте: база могла измениться после проверки
  const { report, file } = planImport(text, await loadExistingState());
  if (mode !== "import" || !file) return { report };

  await applyImport(file, admin.id);
  revalidatePath("/admin/tasks", "layout");
  return { report, imported: true };
}

const statusSchema = z.enum(["draft", "published", "archived"]);

export async function setTaskStatusAction(formData: FormData) {
  const admin = await requireRole("admin");
  const id = z.uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  await setTaskStatus(id, status, admin.id);
  revalidatePath("/admin/tasks", "layout");
}
