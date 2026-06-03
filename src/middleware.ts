import verify from "./verify";
import { getStore, StoreType, Store } from "./store";
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
export function swtMiddleware(options: MiddlewareOptions) {
  const cookieName = options.cookieName ?? "swt_session";
  const requireSession = options.requireSession ?? true;
  const useFingerprint = options.fingerprint ?? true;
  const storeInstance = typeof options.store === "string" ? getStore(options.store) : options.store;

  return async (req: any, res: any, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const sessionId = req.cookies ? req.cookies[cookieName] : undefined;

      let fingerprint: string | undefined;
      if (requireSession && useFingerprint) {
        if (options.getFingerprint) {
          fingerprint = options.getFingerprint(req);
        } else {
          // Default fingerprint is the User-Agent header (or fallback to empty string)
          fingerprint = req.headers["user-agent"] || "";
        }
      }

      // Verify the token using our core async verify function
      const payload = await verify(token, options.secret, {
        sessionId: requireSession ? sessionId : undefined,
        fingerprint: requireSession ? useFingerprint : undefined,
        clientFingerprint: fingerprint,
        store: requireSession ? (storeInstance || undefined) : undefined,
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
