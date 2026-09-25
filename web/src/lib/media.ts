// Хранение картинок для задач на нашем сервере (не во внешнем облаке, 152-ФЗ).
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

export const MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
} as const;

export type MediaExt = keyof typeof MEDIA_TYPES;

// Имя файла: 32 символа хэша + расширение. Больше ничего не принимаем,
// поэтому выйти за пределы папки через "../" невозможно.
export const MEDIA_NAME = /^[0-9a-f]{32}\.(png|jpg|webp|gif)$/;

export function mediaDir(): string {
  return process.env.MEDIA_DIR ?? path.resolve(/* turbopackIgnore: true */ process.cwd(), "../media");
}

// Тип определяем по первым байтам файла, а не по расширению или заявлению браузера.
// SVG не принимаем: внутри него может быть исполняемый код.
export function detectImageType(bytes: Uint8Array): MediaExt | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (starts([0xff, 0xd8, 0xff])) return "jpg";
  if (starts([0x47, 0x49, 0x46, 0x38])) return "gif";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

export function mediaFileName(bytes: Uint8Array, ext: MediaExt): string {
  return `${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}.${ext}`;
}

export async function saveMediaFile(fileName: string, bytes: Uint8Array) {
  const dir = mediaDir();
  await mkdir(dir, { recursive: true });
  // Сначала во временный файл, потом переименование: не бывает недописанных файлов
  const tmp = path.join(/* turbopackIgnore: true */ dir, `.${randomUUID()}.tmp`);
  await writeFile(tmp, bytes);
  await rename(tmp, path.join(/* turbopackIgnore: true */ dir, fileName));
}

export async function readMediaFile(fileName: string): Promise<Buffer | null> {
  if (!MEDIA_NAME.test(fileName)) return null;
  try {
    return await readFile(path.join(/* turbopackIgnore: true */ mediaDir(), fileName));
  } catch {
    return null;
  }
}

// Адреса всех картинок в тексте Markdown: ![описание](адрес)
export function imageSources(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
}
