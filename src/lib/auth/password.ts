import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export type PasswordCredential = {
  passwordHash: string;
  passwordSalt: string;
  passwordAlgorithm: "scrypt-sha256-v1";
};

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")): Promise<PasswordCredential> {
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return {
    passwordHash: key.toString("hex"),
    passwordSalt: salt,
    passwordAlgorithm: "scrypt-sha256-v1",
  };
}

export async function verifyPassword(password: string, credential: PasswordCredential): Promise<boolean> {
  if (credential.passwordAlgorithm !== "scrypt-sha256-v1") {
    return false;
  }

  const candidate = await hashPassword(password, credential.passwordSalt);
  const expected = Buffer.from(credential.passwordHash, "hex");
  const actual = Buffer.from(candidate.passwordHash, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
