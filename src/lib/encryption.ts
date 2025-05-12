import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  throw new Error("Missing ENCRYPTION_KEY environment variable");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine IV, salt, tag, and encrypted data
  const result = Buffer.concat([iv, salt, tag, encrypted]);

  return result.toString("base64");
}

export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, "base64");

  // Extract IV, salt, tag, and encrypted data
  const iv = buffer.subarray(0, IV_LENGTH);
  const salt = buffer.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
  const tag = buffer.subarray(
    IV_LENGTH + SALT_LENGTH,
    IV_LENGTH + SALT_LENGTH + TAG_LENGTH
  );
  const encrypted = buffer.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, "sha256");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final("utf8");
}
