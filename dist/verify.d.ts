import { StoreType } from "./store";
/**
 * Options for verifying a Secure Web Token.
 */
export interface VerifyOptions {
    /**
     * The session ID to verify against the store. Should be retrieved from an HttpOnly cookie.
     */
    sessionId?: string;
    /**
     * The unique fingerprint of the device/session.
     */
    fingerprint?: string;
    /**
     * The store type used to retrieve session data.
     */
    store?: StoreType;
}
/**
 * Verifies and decrypts a Secure Web Token (SWT).
 *
 * @param token - The SWT string to verify.
 * @param secret - The secret key used for decryption and signature verification.
 * @param options - Verification options.
 * @param options.sessionId - The session ID to verify against the store (Backend-only mode).
 * @param options.fingerprint - The device/session fingerprint to verify.
 * @param options.store - The store type used for session verification.
 *
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, or session verification fails.
 */
export default function verify(token: string, secret: string, options?: VerifyOptions): Record<string, any>;
//# sourceMappingURL=verify.d.ts.map