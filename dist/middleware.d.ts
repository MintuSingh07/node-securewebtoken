import { Store } from "./store";
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
     * The secret key (or PEM Public Key) used for verifying the token signature.
     */
    secret: string;
    /**
     * Redis store instance for session revocation checks.
     */
    store?: Store;
    /**
     * The cookie name used to store the sessionId. Defaults to "swt_session".
     */
    cookieName?: string;
    /**
     * Separate payload decryption key. Mandatory if using asymmetric keys.
     */
    encryptionSecret?: string;
    /**
     * Optional logger callback for security events.
     */
    auditLogger?: AuditLogger;
}
/**
 * Express middleware to authenticate and verify Secure Web Tokens.
 * Automatically extracts Bearer token, session cookie, and DPoP proof header.
 * All heavy lifting (signature, encryption, DPoP, session check) happens under the hood.
 *
 * @param options - Config options for the middleware.
 * @returns An Express-compatible middleware handler.
 */
export declare function swtMiddleware(options: MiddlewareOptions): (req: any, res: any, next: NextFunction) => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map