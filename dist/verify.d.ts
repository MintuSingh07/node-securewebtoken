import { StoreType, Store } from "./store";
import { AuditLogger } from "./audit";
/**
 * Options for verifying a Secure Web Token.
 */
export interface VerifyOptions {
    /**
     * The session ID to verify against the store. Should be retrieved from an HttpOnly cookie.
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
export default function verify(token: string, secretOrPublicKey: string, options?: VerifyOptions): Promise<Record<string, any>>;
//# sourceMappingURL=verify.d.ts.map