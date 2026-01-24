import * as crypto from "crypto";
import { base64urlDecode } from "./utils";

/**
 * Decrypts an encrypted SWT payload.
 *
 * @param encryptedPayload - Encrypted Base64URL payload
 * @param secret - Secret key
 * @returns Decrypted payload object
 */
export default function decrypt(
  encryptedPayload: string,
  secret: string
): Record<string, any> {
  const data = base64urlDecode(encryptedPayload);

  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const text = data.subarray(28);

  const key = crypto
    .createHash("sha256")
    .update(secret)
    .digest();

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(text),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
