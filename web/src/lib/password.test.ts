import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "./password";

describe("пароли", () => {
  it("хэш argon2id проверяется верным паролем и не проверяется неверным", async () => {
    const hash = await hashPassword("secret-password");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "secret-password")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("испорченный хэш не роняет проверку", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });

  it("генерирует пароль без похожих символов", () => {
    for (let i = 0; i < 100; i++) {
      const password = generatePassword();
      expect(password).toHaveLength(10);
      expect(password).not.toMatch(/[01lIoO]/);
    }
  });
});
