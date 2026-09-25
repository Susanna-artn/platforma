// Текст в Markdown с формулами LaTeX: $...$ в строке, $$...$$ отдельным блоком.
// HTML внутри текста не выполняется (react-markdown его не рендерит),
// картинки разрешены только наши, из /media/.
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

const components: Components = {
  img({ src, alt }) {
    if (typeof src !== "string" || !src.startsWith("/media/")) {
      return <span className="text-red-600">[картинка не из нашего хранилища: {alt}]</span>;
    }
    // eslint-disable-next-line @next/next/no-img-element -- картинки задач отдаёт наш маршрут /media
    return <img src={src} alt={alt ?? ""} className="my-2 max-h-96 max-w-full" />;
  },
  p: ({ children }) => <p className="my-2">{children}</p>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-6">{children}</ol>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-6">{children}</ul>,
};

export function MathText({ children }: { children: string }) {
  return (
    <div className="leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        // Ошибку в формуле показываем красным, а не роняем страницу
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
