import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Подготовка по математике и физике",
  description: "Задания, проверка решений и разбор ошибок",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
