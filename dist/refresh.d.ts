import { StoreType, Store } from "./store";
import { AuditLogger } from "./audit";
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
     * Whether session/device verification is enabled.
     */
    fingerprint?: boolean;
    /**
     * The unique client fingerprint string (e.g., User-Agent or IP).
     */
    clientFingerprint?: string;
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
export default function refresh(refreshToken: string, secret: string, options?: RefreshOptions): Promise<{
    token: string;
    sessionId?: string;
    refreshToken?: string;
}>;
//# sourceMappingURL=refresh.d.ts.map