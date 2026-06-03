import { StoreType, Store } from "./store";
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
     * Whether to enable fingerprint/session mode. If true, generates a device-bound session.
     */
    fingerprint?: boolean;
    /**
     * The unique client fingerprint string (e.g., User-Agent or IP).
     */
    clientFingerprint?: string;
    /**
     * The store type or store instance to use for session persistence.
     */
    store?: StoreType | Store;
    /**
     * Whether to generate a refresh token alongside the access token.
     */
    generateRefreshToken?: boolean;
    /**
     * Refresh token expiration time in seconds. Defaults to 604800 (7 days).
     */
    refreshExpiresIn?: number;
    /**
     * Optional logger callback for security and audit events.
     */
    auditLogger?: AuditLogger;
    /**
     * Pre-existing device ID to bind. If not provided and fingerprint is true, generates a new one.
     */
    deviceId?: string;
    /**
     * Pre-existing session ID to bind.
     */
    sessionId?: string;
    /**
     * Separate payload encryption key. Mandatory if using asymmetric keys and verifier needs to decrypt.
     */
    encryptionSecret?: string;
    /**
     * Optional browser-generated public key (JWK format) for DPoP binding.
     */
    clientPublicKey?: string;
}
/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId` if using fingerprint/session mode.
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