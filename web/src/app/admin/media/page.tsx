import { desc } from "drizzle-orm";
import { AppHeader } from "@/components/app-header";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireRole } from "@/lib/dal";
import { UploadForm } from "./upload-form";

export default async function MediaPage() {
  const admin = await requireRole("admin");
  const list = await db.select().from(media).orderBy(desc(media.createdAt));

  return (
    <>
      <AppHeader user={admin} />
      <main className="mx-auto w-full max-w-5xl p-6">
        <h1 className="mb-2 text-xl font-semibold">Картинки для задач</h1>
        <p className="mb-4 text-sm text-gray-600">
          PNG, JPEG, WebP или GIF до 4 МБ. Файлы хранятся на нашем сервере.
        </p>
        <UploadForm />

        {list.length === 0 ? (
          <p className="text-gray-600">Картинок пока нет.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => (
              <figure key={m.id} className="rounded border border-gray-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- отдаёт наш маршрут /media */}
                <img
                  src={`/media/${m.fileName}`}
                  alt={m.originalName}
                  className="mb-2 h-40 w-full object-contain"
                />
                <figcaption className="text-xs">
                  <p className="truncate text-gray-600">{m.originalName}</p>
                  <code className="block select-all break-all font-mono">
                    ![описание](/media/{m.fileName})
                  </code>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
