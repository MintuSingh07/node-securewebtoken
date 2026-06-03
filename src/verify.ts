import * as crypto from "crypto";
import decrypt from "./decrypt";
import { timingSafeEqual } from "./utils";
import { getStore, StoreType, Store } from "./store";
import { AuditLogger, logEvent } from "./audit";

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
   * The store type or store instance used to retrieve session data.
   */
  store?: StoreType | Store;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
}

/**
 * Verifies and decrypts a Secure Web Token (SWT).
 * 
 * @param token - The SWT string to verify.
 * @param secret - The secret key used for decryption and signature verification.
 * @param options - Verification options.
 * 
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, or session verification fails.
 */
export default async function verify(
  token: string,
  secret: string,
  options: VerifyOptions = {}
): Promise<Record<string, any>> {
  try {
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
    if (payload.fp || options.sessionId || options.fingerprint) {
      if (!options.sessionId || !options.fingerprint) {
        throw new Error("Session ID and fingerprint are required for device-bound tokens");
      }

      const store = typeof options.store === "string" ? getStore(options.store) : options.store;
      if (!store) throw new Error("No store available");

      const session = await store.getSession(options.sessionId);
      if (!session) throw new Error("Session revoked or invalid");
      if (session.userId !== payload.data.userId) throw new Error("User mismatch");
      if (session.fingerprint !== options.fingerprint) throw new Error("Device mismatch");
    }

    // Trigger audit log success event
    await logEvent(options.auditLogger, {
      event: "verify_success",
      userId: payload.data?.userId,
      sessionId: options.sessionId,
    });

    return payload;
  } catch (err: any) {
    // Trigger audit log failure event
    await logEvent(options.auditLogger, {
      event: "verify_failure",
      sessionId: options.sessionId,
      reason: err.message || "Verification failed",
    });
    throw err;
  }
}

