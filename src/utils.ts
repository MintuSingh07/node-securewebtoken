import * as crypto from "crypto";

/**
 * Encode data into Base64URL format.
 * Used to make tokens URL-safe.
 *
 * @param input - Buffer or string to encode
 * @returns Base64URL encoded string
 */
export function base64urlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * Decode Base64URL encoded data back into Buffer.
 *
 * @param input - Base64URL string
 * @returns Decoded Buffer
 */
export function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/**
 * Create a SHA-256 hash.
 * Useful for hashing fingerprints or secrets.
 *
 * @param data - String or Buffer to hash
 * @returns SHA-256 hash Buffer
 */
export function hash(data: string | Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

/**
 * Compare two buffers in constant time.
 * Prevents timing attacks.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns True if equal, false otherwise
 */
export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
