"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireRole } from "@/lib/dal";
import {
  detectImageType,
  MAX_MEDIA_BYTES,
  MEDIA_TYPES,
  mediaFileName,
  saveMediaFile,
} from "@/lib/media";

export type UploadState = { error?: string; fileName?: string };

export async function uploadMediaAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const admin = await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Выберите файл" };
  if (file.size > MAX_MEDIA_BYTES) return { error: "Файл больше 4 МБ" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectImageType(bytes);
  if (!ext) return { error: "Поддерживаются только PNG, JPEG, WebP и GIF" };

  const fileName = mediaFileName(bytes, ext);
  await saveMediaFile(fileName, bytes);
  await db
    .insert(media)
    .values({
      fileName,
      originalName: file.name.slice(0, 200),
      mimeType: MEDIA_TYPES[ext],
      sizeBytes: bytes.length,
      uploadedBy: admin.id,
    })
    // Такая же картинка уже загружена - это нормально, имя то же
    .onConflictDoNothing();

  revalidatePath("/admin/media");
  return { fileName };
}
