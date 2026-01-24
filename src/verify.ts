import * as crypto from "crypto";
import decrypt from "./decrypt";
import { timingSafeEqual } from "./utils";
import { getStore, StoreType } from "./store";

/**
 * Options for verifying a Secure Web Token.
 */
export interface VerifyOptions {
  /**
   * The session ID to verify against the store. Should be retrieved from an HttpOnly cookie.
   */
  sessionId?: string; // read from HttpOnly cookie
  /**
   * The unique fingerprint of the device/session.
   */
  fingerprint?: string;
  /**
   * The store type used to retrieve session data.
   */
  store?: StoreType;
}

/**
 * Verifies and decrypts a Secure Web Token (SWT).
 * 
 * @param token - The SWT string to verify.
 * @param secret - The secret key used for decryption and signature verification.
 * @param options - Verification options.
 * @param options.sessionId - The session ID to verify against the store (Backend-only mode).
 * @param options.fingerprint - The device/session fingerprint to verify.
 * @param options.store - The store type used for session verification.
 * 
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, or session verification fails.
 */
export default function verify(
  token: string,
  secret: string,
  options: VerifyOptions = {}
): Record<string, any> {

  if (!token || typeof token !== "string") throw new Error("Token must be string");

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [header, encryptedPayload, signature] = parts;
  const dataToVerify = `${header}.${encryptedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(dataToVerify)
    .digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)))
    throw new Error("Invalid signature");

  const payload = decrypt(encryptedPayload, secret);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) throw new Error("Token expired");
  if (!payload.data || typeof payload.data !== "object") throw new Error("Invalid payload");

  // Server-side session verification
  if (options.sessionId && options.fingerprint) {
    const store = getStore(options.store);
    if (!store) throw new Error("No store available");

    const session = store.getSession(options.sessionId);
    if (!session) throw new Error("Session revoked or invalid");
    if (session.userId !== payload.data.userId) throw new Error("User mismatch");
    if (session.fingerprint !== options.fingerprint) throw new Error("Device mismatch");
  }

  return payload;
}
