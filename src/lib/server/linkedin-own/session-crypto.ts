import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// A LinkedIn session cookie is the whole account: anyone holding li_at can
// read and send as that person. Cookies are only ever stored encrypted
// (AES-256-GCM, key from LINKEDIN_SESSION_KEY) and are never logged.

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

export function parseSessionKey(rawKey = process.env.LINKEDIN_SESSION_KEY) {
  if (!rawKey) throw new Error("LINKEDIN_SESSION_KEY is not set.");
  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error("LINKEDIN_SESSION_KEY must be 32 bytes, base64 encoded.");
  }
  return key;
}

export function encryptSessionSecret(plaintext: string, rawKey?: string) {
  const key = parseSessionKey(rawKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSessionSecret(sealed: string, rawKey?: string) {
  const [version, iv, tag, ciphertext] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Stored LinkedIn session has an unknown format.");
  }
  const decipher = createDecipheriv(ALGORITHM, parseSessionKey(rawKey), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
