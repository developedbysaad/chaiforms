import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

import type { EncryptedSecret } from "@repo/database/schema";

import { env } from "../env";

const ALGO = "aes-256-gcm";

function deriveKey(salt: Buffer): Buffer {
  const ikm = Buffer.from(env.BETTER_AUTH_SECRET, "utf8");
  // HKDF-SHA256 → 32 bytes
  const okm = hkdfSync("sha256", ikm, salt, Buffer.from("chaiform-secret-v1"), 32);
  return Buffer.from(okm);
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(salt);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    authTag: tag.toString("base64"),
    salt: salt.toString("base64"),
  };
}

export function decryptSecret(enc: EncryptedSecret): string {
  const salt = Buffer.from(enc.salt, "base64");
  const iv = Buffer.from(enc.iv, "base64");
  const tag = Buffer.from(enc.authTag, "base64");
  const ct = Buffer.from(enc.ciphertext, "base64");
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
