import verify from "./verify";
import sign from "./sign";
import { StoreType, Store } from "./store";
import { AuditLogger, logEvent } from "./audit";

/**
 * Options for refreshing a Secure Web Token.
 */
export interface RefreshOptions {
  /**
   * Token expiration time in seconds for the new access token. Defaults to 900 (15 minutes).
   */
  expiresIn?: number;
  /**
   * Expiration time for the new refresh token. Defaults to 604800 (7 days).
   */
  refreshExpiresIn?: number;
  /**
   * The session ID to verify against the store (retrieved from HttpOnly cookie).
   */
  sessionId?: string;
  /**
   * The unique fingerprint of the device/session.
   */
  fingerprint?: string;
  /**
   * The store type or store instance used for session verification.
   */
  store?: StoreType | Store;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
}

/**
 * Verifies a refresh token and generates a new access token and rotated refresh token.
 * 
 * @param refreshToken - The signed refresh token string.
 * @param secret - The secret key used for verification and signing.
 * @param options - Configuration options.
 * 
 * @returns An object containing the new `token`, optional `sessionId`, and new `refreshToken`.
 */
export default async function refresh(
  refreshToken: string,
  secret: string,
  options: RefreshOptions = {}
): Promise<{ token: string; sessionId?: string; refreshToken?: string }> {
  try {
    if (!refreshToken) throw new Error("Refresh token required");

    // 1. Verify and decrypt the refresh token.
    // If sessionId and fingerprint are provided, verify() will automatically check them.
    const payload = await verify(refreshToken, secret, {
      sessionId: options.sessionId,
      fingerprint: options.fingerprint,
      store: options.store,
      auditLogger: options.auditLogger, // Let verify handle audit logging internally
    });

    // 2. Assert that this is indeed a refresh token
    if (payload.isRefresh !== true) {
      throw new Error("Invalid token type: not a refresh token");
    }

    const userId = payload.data?.userId;
    if (!userId) {
      throw new Error("Invalid refresh token payload: missing userId");
    }

    // 3. Generate a new rotated Access Token and new Refresh Token.
    // Reuse the exact same device/session ID so we don't duplicate sessions or break XSS cookies.
    const result = await sign(
      { userId },
      secret,
      {
        expiresIn: options.expiresIn,
        generateRefreshToken: true,
        refreshExpiresIn: options.refreshExpiresIn,
        fingerprint: !!payload.fp,
        deviceId: payload.fp, // Keep the same device fingerprint binding!
        sessionId: options.sessionId, // Keep the same session ID!
        store: options.store,
        auditLogger: options.auditLogger,
      }
    );

    // Trigger audit log refresh event
    await logEvent(options.auditLogger, {
      event: "refresh",
      userId,
      sessionId: options.sessionId,
      deviceId: payload.fp,
    });

    return result;
  } catch (err: any) {
    // Audit log failure is already handled inside verify() if it failed there,
    // but if it failed in step 2 or 3, we log a verify_failure here:
    await logEvent(options.auditLogger, {
      event: "verify_failure",
      sessionId: options.sessionId,
      reason: err.message || "Refresh failed",
    });
    throw err;
  }
}
