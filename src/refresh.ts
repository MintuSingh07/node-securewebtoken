import verify from "./verify";
import sign from "./sign";
import { Store } from "./store";
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
   * The session ID to verify against Redis (retrieved from HttpOnly cookie).
   */
  sessionId?: string;
  /**
   * Redis store instance for session revocation checks and new session registration.
   */
  store?: Store;
  /**
   * The self-contained DPoP proof string from the client's `x-dpop-proof` header.
   * Required when refreshing a DPoP-bound token.
   */
  dpopProof?: string;
  /**
   * The client's public key (JWK format) to bind the new tokens.
   * Required when refreshing a DPoP-bound token.
   */
  clientPublicKey?: string | Record<string, any>;
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

    // 1. Verify and decrypt the refresh token (including DPoP if bound)
    const payload = await verify(refreshToken, secret, {
      sessionId: options.sessionId,
      store: options.store,
      dpopProof: options.dpopProof,
      auditLogger: options.auditLogger,
    });

    // 2. Assert that this is indeed a refresh token
    if (payload.isRefresh !== true) {
      throw new Error("Invalid token type: not a refresh token");
    }

    const userId = payload.data?.userId;
    if (!userId) {
      throw new Error("Invalid refresh token payload: missing userId");
    }

    // 3. Determine if the token was DPoP-bound
    const hasDpop = !!(payload.cnf && payload.cnf.jkt);

    if (hasDpop && !options.clientPublicKey) {
      throw new Error("clientPublicKey is required to refresh a DPoP-bound token");
    }

    // 4. Generate new rotated Access Token and Refresh Token
    const result = await sign(
      { userId },
      secret,
      {
        expiresIn: options.expiresIn,
        generateRefreshToken: true,
        refreshExpiresIn: options.refreshExpiresIn,
        fingerprint: hasDpop,
        clientPublicKey: hasDpop ? options.clientPublicKey : undefined,
        store: options.store,
        auditLogger: options.auditLogger,
      }
    );

    // Trigger audit log refresh event
    await logEvent(options.auditLogger, {
      event: "refresh",
      userId,
      sessionId: options.sessionId,
    });

    return result;
  } catch (err: any) {
    await logEvent(options.auditLogger, {
      event: "verify_failure",
      sessionId: options.sessionId,
      reason: err.message || "Refresh failed",
    });
    throw err;
  }
}
