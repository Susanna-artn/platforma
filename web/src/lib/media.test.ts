import { describe, expect, it } from "vitest";
import { detectImageType, MEDIA_NAME, mediaFileName, imageSources } from "./media";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

describe("картинки", () => {
  it("тип определяется по содержимому", () => {
    expect(detectImageType(png)).toBe("png");
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(detectImageType(webp)).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBe("gif");
  });

  it("имя файла - хэш содержимого, одинаковые файлы дают одно имя", () => {
    const name = mediaFileName(png, "png");
    expect(name).toMatch(MEDIA_NAME);
    expect(mediaFileName(png, "png")).toBe(name);
  });

  it("имя с путём не проходит проверку", () => {
    expect(MEDIA_NAME.test("../../etc/passwd")).toBe(false);
    expect(MEDIA_NAME.test("a".repeat(32) + ".svg")).toBe(false);
  });

  it("находит ссылки на картинки в Markdown", () => {
    const text = "См. рис. ![Схема](/media/abc.png) и ![](/media/def.jpg). ![чужая](https://x.ru/a.png)";
    expect(imageSources(text)).toEqual([
      "/media/abc.png",
      "/media/def.jpg",
      "https://x.ru/a.png",
    ]);
  });
});
