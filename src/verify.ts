import * as crypto from "crypto";
import decrypt from "./decrypt";
import { timingSafeEqual, base64urlDecode } from "./utils";
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
   * Whether session/device verification is enabled.
   */
  fingerprint?: boolean;
  /**
   * The unique client fingerprint string (e.g., User-Agent or IP).
   */
  clientFingerprint?: string;
  /**
   * The store type or store instance used to retrieve session data.
   */
  store?: StoreType | Store;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
  /**
   * Separate payload decryption key. Mandatory if using asymmetric keys and verifier needs to decrypt.
   */
  encryptionSecret?: string;
  /**
   * Optional browser-generated signature (DPoP) for request proof-of-possession.
   */
  clientSignature?: string;
  /**
   * The plaintext payload (JSON string containing timestamp/URL/method) signed by the browser.
   */
  clientPayload?: string;
}

/**
 * Verifies and decrypts a Secure Web Token (SWT).
 * 
 * @param token - The SWT string to verify.
 * @param secretOrPublicKey - The secret key (or PEM Public Key) used for decryption and signature verification.
 * @param options - Verification options.
 * 
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, or session/DPoP verification fails.
 */
export default async function verify(
  token: string,
  secretOrPublicKey: string,
  options: VerifyOptions = {}
): Promise<Record<string, any>> {
  try {
    if (!token || typeof token !== "string") throw new Error("Token must be string");

    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");

    const [headerB64, encryptedPayload, signature] = parts;

    // Fast pre-decryption expiration validation
    const headerStr = base64urlDecode(headerB64).toString("utf8");
    let headerObj: Record<string, any>;
    try {
      headerObj = JSON.parse(headerStr);
    } catch {
      throw new Error("Invalid token header");
    }

    const now = Math.floor(Date.now() / 1000);
    if (headerObj.exp && headerObj.exp < now) {
      throw new Error("Token expired");
    }

    const dataToVerify = `${headerB64}.${encryptedPayload}`;
    const isPem = secretOrPublicKey.includes("-----BEGIN");

    if (isPem) {
      // Asymmetric signature verification (RSA-SHA256)
      const verifier = crypto.createVerify("SHA256");
      verifier.update(dataToVerify);
      const isValid = verifier.verify(secretOrPublicKey, signature, "base64url");
      if (!isValid) throw new Error("Invalid signature");
    } else {
      // Symmetric signature verification (HMAC-SHA256)
      const expectedSignature = crypto
        .createHmac("sha256", secretOrPublicKey)
        .update(dataToVerify)
        .digest("base64url");

      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)))
        throw new Error("Invalid signature");
    }

    const encSecret = options.encryptionSecret || secretOrPublicKey;
    const payload = decrypt(encryptedPayload, encSecret);

    // Double check payload expiration (fallback security)
    if (payload.exp < now) throw new Error("Token expired");
    if (!payload.data || typeof payload.data !== "object") throw new Error("Invalid payload");

    const store = typeof options.store === "string" ? getStore(options.store) : options.store;

    // Server-side session verification
    if (payload.fp || options.sessionId || options.fingerprint) {
      if (!options.sessionId) {
        throw new Error("Session ID is required for device-bound tokens");
      }
      if (!store) throw new Error("No store available");

      const session = await store.getSession(options.sessionId);
      if (!session) throw new Error("Session revoked or invalid");
      if (session.userId !== payload.data.userId) throw new Error("User mismatch");

      const expectedFingerprint = options.clientFingerprint ?? payload.fp;
      if (session.fingerprint !== expectedFingerprint) throw new Error("Device mismatch");

      // DPoP Verification if a public key was bound to this session
      if (session.clientPublicKey) {
        if (!options.clientSignature || !options.clientPayload) {
          throw new Error("Client signature required for secure binding");
        }

        // Validate client signature payload format and timestamp (anti-replay)
        let parsedPayload: Record<string, any>;
        try {
          parsedPayload = JSON.parse(options.clientPayload);
        } catch {
          throw new Error("Invalid client payload format");
        }

        if (!parsedPayload.timestamp || Math.abs(now - parsedPayload.timestamp) > 300) {
          throw new Error("Client payload timestamp expired or invalid");
        }

        // Verify the browser signature using the registered client public key (JWK)
        try {
          const clientJwk = JSON.parse(session.clientPublicKey);
          const clientKeyObject = crypto.createPublicKey({
            key: clientJwk,
            format: 'jwk'
          });

          const clientVerifier = crypto.createVerify("SHA256");
          clientVerifier.update(options.clientPayload);
          const isClientSigValid = clientVerifier.verify(
            clientKeyObject,
            options.clientSignature,
            "base64url"
          );

          if (!isClientSigValid) {
            throw new Error("Client signature verification failed");
          }
        } catch (jwkErr: any) {
          throw new Error(`DPoP verification failed: ${jwkErr.message}`);
        }
      }
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
