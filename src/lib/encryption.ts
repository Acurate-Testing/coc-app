import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Only check for ENCRYPTION_KEY on the server side
const ENCRYPTION_KEY = typeof window === 'undefined' 
  ? (() => {
      if (!process.env.ENCRYPTION_KEY) {
        throw new Error("Missing ENCRYPTION_KEY environment variable");
      }
      return process.env.ENCRYPTION_KEY;
    })()
  : null;

export function encrypt(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, "sha256");

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combine all components
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    return result.toString("base64");
  } else {
    // Client-side encryption
    throw new Error("Client-side encryption is not supported. Please use the API endpoint for encryption.");
  }
}

export function decrypt(encryptedText: string): string {
  if (typeof window === 'undefined') {
    // Server-side decryption
    const buffer = Buffer.from(encryptedText, "base64");

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  } else {
    // Client-side decryption
    throw new Error("Client-side decryption is not supported. Please use the API endpoint for decryption.");
  }
}
