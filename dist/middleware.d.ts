import { StoreType, Store } from "./store";
import { AuditLogger } from "./audit";
/**
 * Standard NextFunction type for Express middleware.
 */
export type NextFunction = (err?: any) => void;
/**
 * Custom request definition containing SWT session information.
 */
export interface SwtRequest {
    headers: Record<string, any>;
    cookies?: Record<string, any>;
    swt?: Record<string, any>;
    sessionId?: string;
    [key: string]: any;
}
/**
 * Options for configuring the swtMiddleware.
 */
export interface MiddlewareOptions {
    /**
     * The secret key used for verifying the token signature.
     */
    secret: string;
    /**
     * The cookie name used to store the sessionId. Defaults to "swt_session".
     */
    cookieName?: string;
    /**
     * Pluggable store type or direct Store instance. Defaults to "memory".
     */
    store?: StoreType | Store;
    /**
     * Whether to require session verification from the store. If true, both bearer token
     * and HttpOnly cookie matching are checked. Defaults to true.
     */
    requireSession?: boolean;
    /**
     * Whether to enable fingerprint/device verification. Defaults to true.
     */
    fingerprint?: boolean;
    /**
     * Custom function to extract device fingerprint from request headers or IP.
     * If not provided, defaults to the request's User-Agent string.
     */
    getFingerprint?: (req: any) => string;
    /**
     * Optional logger callback for security events.
     */
    auditLogger?: AuditLogger;
}
/**
 * Express middleware helper to authenticate and verify Secure Web Tokens.
 * Automatically extracts the token and validates device fingerprinting.
 *
 * @param options - Config options for the middleware.
 * @returns An Express-compatible middleware handler.
 */
export declare function swtMiddleware(options: MiddlewareOptions): (req: any, res: any, next: NextFunction) => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map