import * as crypto from "crypto";
import decrypt from "./decrypt";
import { timingSafeEqual, base64urlDecode } from "./utils";
import { Store } from "./store";
import { AuditLogger, logEvent } from "./audit";
import { verifyDpopProof } from "./dpop";

/**
 * Options for verifying a Secure Web Token.
 */
export interface VerifyOptions {
  /**
   * The session ID to verify against Redis. Should be retrieved from an HttpOnly cookie.
   * When provided, the session must exist in the store (revocation check).
   */
  sessionId?: string;
  /**
   * Redis store instance for session revocation checks.
   * Required when sessionId is provided.
   */
  store?: Store;
  /**
   * The self-contained DPoP proof string from the client's `x-dpop-proof` header.
   * Required when the token contains a DPoP binding (cnf.jkt).
   */
  dpopProof?: string;
  /**
   * Separate payload decryption key. Mandatory if using asymmetric keys.
   */
  encryptionSecret?: string;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
}

/**
 * Verifies and decrypts a Secure Web Token (SWT).
 *
 * @param token - The SWT string to verify.
 * @param secretOrPublicKey - The secret key (or PEM Public Key) used for decryption and signature verification.
 * @param options - Verification options.
 *
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, session is revoked, or DPoP verification fails.
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

    // Session revocation check (Redis)
    if (options.sessionId) {
      if (!options.store) throw new Error("Store is required when sessionId is provided");

      const session = await options.store.getSession(options.sessionId);
      if (!session) throw new Error("Session revoked or invalid");
      if (session.userId !== payload.data.userId) throw new Error("User mismatch");

      // Cross-check DPoP thumbprint stored in Redis vs token payload
      if (session.jkt && payload.cnf?.jkt) {
        if (session.jkt !== payload.cnf.jkt) {
          throw new Error("DPoP key binding mismatch between session and token");
        }
      }
    }

    // DPoP proof-of-possession verification (when token is DPoP-bound)
    if (payload.cnf && payload.cnf.jkt) {
      if (!options.dpopProof) {
        throw new Error("DPoP proof required for this token");
      }
      verifyDpopProof(options.dpopProof, payload.cnf.jkt);
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
