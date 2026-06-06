import { Store } from "./store";
import { AuditLogger } from "./audit";
/**
 * Options for signing a Secure Web Token.
 */
export interface SignOptions {
    /**
     * Token expiration time in seconds. Defaults to 900 (15 minutes).
     */
    expiresIn?: number;
    /**
     * Whether to enable DPoP (Proof-of-Possession) binding.
     * When true, requires `clientPublicKey` and `store`.
     * Under the hood: computes JWK Thumbprint, embeds cnf.jkt in the token,
     * and registers the binding in Redis for session revocation.
     */
    fingerprint?: boolean;
    /**
     * The client's public key (JWK format) from the browser's Web Crypto API.
     * Required when fingerprint is true. Accepts a JWK object or JSON string.
     */
    clientPublicKey?: string | Record<string, any>;
    /**
     * Redis store instance for session persistence and revocation.
     * Required when fingerprint is true.
     */
    store?: Store;
    /**
     * Whether to generate a refresh token alongside the access token.
     */
    generateRefreshToken?: boolean;
    /**
     * Refresh token expiration time in seconds. Defaults to 604800 (7 days).
     */
    refreshExpiresIn?: number;
    /**
     * Separate payload encryption key. Mandatory if using asymmetric keys.
     */
    encryptionSecret?: string;
    /**
     * Optional logger callback for security and audit events.
     */
    auditLogger?: AuditLogger;
}
/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId`.
 * @param secretOrPrivateKey - The secret key (or PEM Private Key) used for encryption and signing.
 * @param options - Configuration options for the token.
 *
 * @returns An object containing the generated `token`, optional `sessionId`, and optional `refreshToken`.
 */
export default function sign(data: Record<string, any>, secretOrPrivateKey: string, options?: SignOptions): Promise<{
    token: string;
    sessionId?: string;
    refreshToken?: string;
}>;
//# sourceMappingURL=sign.d.ts.map