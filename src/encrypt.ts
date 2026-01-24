import * as crypto from "crypto";
import { base64urlEncode } from "./utils";

/**
 * Encrypts payload using AES-256-GCM.
 * Payload is fully encrypted (unlike JWT).
 *
 * @param payload - Object to encrypt
 * @param secret - Secret key
 * @returns Encrypted Base64URL string
 */
export default function encrypt(
  payload: Record<string, any>,
  secret: string
): string {
  const iv = crypto.randomBytes(12);

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return base64urlEncode(Buffer.concat([iv, tag, encrypted]));
}
