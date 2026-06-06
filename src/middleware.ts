import verify from "./verify";
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
export function swtMiddleware(options: MiddlewareOptions) {
  const cookieName = options.cookieName ?? "swt_session";

  return async (req: any, res: any, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
      }

      const token = authHeader.split(" ")[1];

      // Auto-extract DPoP proof from header (if present)
      const dpopProof = req.headers["x-dpop-proof"];

      // Auto-extract session ID from HttpOnly cookie (for revocation check)
      const sessionId = req.cookies ? req.cookies[cookieName] : undefined;

      // Verify token: signature, decryption, session, and DPoP — all automatic
      const payload = await verify(token, options.secret, {
        sessionId: sessionId || undefined,
        store: options.store || undefined,
        dpopProof: typeof dpopProof === "string" ? dpopProof : undefined,
        encryptionSecret: options.encryptionSecret,
        auditLogger: options.auditLogger,
      });

      // Attach decrypted payload data and session context to request object
      req.swt = payload.data;
      req.sessionId = sessionId;

      next();
    } catch (err: any) {
      res.status(401).json({ error: err.message || "Unauthorized" });
    }
  };
}
