import { Store } from "./store";
import { AuditLogger } from "./audit";
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
export default function verify(token: string, secretOrPublicKey: string, options?: VerifyOptions): Promise<Record<string, any>>;
//# sourceMappingURL=verify.d.ts.map