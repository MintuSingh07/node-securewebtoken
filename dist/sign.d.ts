import { StoreType } from "./store";
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
    fingerprint?: true;
    /**
     * The store type to use for session persistence.
     */
    store?: StoreType;
}
/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId` if using fingerprint/session mode.
 * @param secret - The secret key used for encryption and HMAC signing.
 * @param options - Configuration options for the token.
 * @param options.expiresIn - Token expiration time in seconds (default: 900).
 * @param options.fingerprint - Set to true to enable device-bound session mode.
 * @param options.store - The store type to use for session persistence (e.g., 'memory').
 *
 * @returns An object containing the generated `token` and an optional `sessionId` if fingerprinting is enabled.
 *
 * @example
 * const { token, sessionId } = sign({ userId: '123' }, 'my-secret', { fingerprint: true });
 */
export default function sign(data: Record<string, any>, secret: string, options?: SignOptions): {
    token: string;
    sessionId?: string;
};
//# sourceMappingURL=sign.d.ts.map