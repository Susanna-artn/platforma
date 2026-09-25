import { randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

// argon2id с параметрами по умолчанию (m=19456, t=2, p=1) - минимум по OWASP
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Без похожих символов (0/O, 1/l/I), чтобы ребёнок мог перепечатать пароль с листка
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 10): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[randomInt(ALPHABET.length)];
  }
  return result;
}

export const MIN_PASSWORD_LENGTH = 10;
