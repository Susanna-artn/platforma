"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import {
  consentDateSchema,
  createUserSchema,
  fieldErrors,
} from "@/lib/user-validation";
import {
  createUser,
  LoginTakenError,
  linkParent,
  resetPassword,
  setActive,
  setParentConsent,
  unlinkParent,
} from "@/lib/users";

// Любой server action - это открытая точка входа, поэтому каждое
// действие начинается с проверки роли, даже если кнопку видит только admin.

const idSchema = z.uuid();

function revalidateUsers() {
  revalidatePath("/admin/users", "layout");
}

export type CreateUserState = {
  errors?: Record<string, string>;
  created?: { id: string; login: string; password: string };
};

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireRole("admin");
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  try {
    const created = await createUser(parsed.data);
    revalidateUsers();
    return { created };
  } catch (error) {
    if (error instanceof LoginTakenError) {
      return { errors: { login: "Такой логин уже занят" } };
    }
    throw error;
  }
}

export type ResetPasswordState = { password?: string };

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireRole("admin");
  const id = idSchema.parse(formData.get("id"));
  return { password: await resetPassword(id) };
}

export async function setActiveAction(formData: FormData) {
  const admin = await requireRole("admin");
  const id = idSchema.parse(formData.get("id"));
  const active = formData.get("active") === "true";
  // Нельзя заблокировать самого себя, иначе в админку никто не войдёт
  if (id === admin.id && !active) return;
  await setActive(id, active);
  revalidateUsers();
}

export type FormState = { error?: string };

export async function setConsentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");
  const id = idSchema.parse(formData.get("id"));
  const date = consentDateSchema.safeParse(formData.get("date"));
  if (!date.success) return { error: date.error.issues[0].message };
  await setParentConsent(id, date.data, admin.id);
  revalidateUsers();
  return {};
}

export async function revokeConsentAction(formData: FormData) {
  const admin = await requireRole("admin");
  const id = idSchema.parse(formData.get("id"));
  await setParentConsent(id, null, admin.id);
  revalidateUsers();
}

export async function linkParentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const parentId = idSchema.safeParse(formData.get("parentId"));
  const studentId = idSchema.safeParse(formData.get("studentId"));
  if (!parentId.success || !studentId.success) return { error: "Выберите, кого связать" };
  try {
    await linkParent(parentId.data, studentId.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось связать" };
  }
  revalidateUsers();
  return {};
}

export async function unlinkParentAction(formData: FormData) {
  await requireRole("admin");
  await unlinkParent(
    idSchema.parse(formData.get("parentId")),
    idSchema.parse(formData.get("studentId")),
  );
  revalidateUsers();
}
