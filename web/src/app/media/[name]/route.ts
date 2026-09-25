// Отдаёт картинку задачи. Только вошедшим пользователям.
import { getCurrentUser } from "@/lib/dal";
import { MEDIA_NAME, MEDIA_TYPES, readMediaFile, type MediaExt } from "@/lib/media";

export async function GET(_request: Request, ctx: RouteContext<"/media/[name]">) {
  const { name } = await ctx.params;
  if (!(await getCurrentUser())) return new Response("Нужно войти", { status: 401 });
  if (!MEDIA_NAME.test(name)) return new Response("Не найдено", { status: 404 });

  const file = await readMediaFile(name);
  if (!file) return new Response("Не найдено", { status: 404 });

  const ext = name.split(".").pop() as MediaExt;
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": MEDIA_TYPES[ext],
      // Имя - хэш содержимого, файл по этому имени никогда не меняется
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
