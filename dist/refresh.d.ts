import { Store } from "./store";
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
export default function refresh(refreshToken: string, secret: string, options?: RefreshOptions): Promise<{
    token: string;
    sessionId?: string;
    refreshToken?: string;
}>;
//# sourceMappingURL=refresh.d.ts.map