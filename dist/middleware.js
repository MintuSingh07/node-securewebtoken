"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swtMiddleware = swtMiddleware;
const verify_1 = __importDefault(require("./verify"));
/**
 * Express middleware to authenticate and verify Secure Web Tokens.
 * Automatically extracts Bearer token, session cookie, and DPoP proof header.
 * All heavy lifting (signature, encryption, DPoP, session check) happens under the hood.
 *
 * @param options - Config options for the middleware.
 * @returns An Express-compatible middleware handler.
 */
function swtMiddleware(options) {
    const cookieName = options.cookieName ?? "swt_session";
    return async (req, res, next) => {
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
            const payload = await (0, verify_1.default)(token, options.secret, {
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
        }
        catch (err) {
            res.status(401).json({ error: err.message || "Unauthorized" });
        }
    };
}
