"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swtMiddleware = swtMiddleware;
const verify_1 = __importDefault(require("./verify"));
const store_1 = require("./store");
/**
 * Express middleware helper to authenticate and verify Secure Web Tokens.
 * Automatically extracts the token and validates device fingerprinting & DPoP.
 *
 * @param options - Config options for the middleware.
 * @returns An Express-compatible middleware handler.
 */
function swtMiddleware(options) {
    const cookieName = options.cookieName ?? "swt_session";
    const requireSession = options.requireSession ?? true;
    const useFingerprint = options.fingerprint ?? true;
    const storeInstance = typeof options.store === "string" ? (0, store_1.getStore)(options.store) : options.store;
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({ error: "Missing or invalid Authorization header" });
                return;
            }
            const token = authHeader.split(" ")[1];
            const sessionId = req.cookies ? req.cookies[cookieName] : undefined;
            let fingerprint;
            if (requireSession && useFingerprint) {
                if (options.getFingerprint) {
                    fingerprint = options.getFingerprint(req);
                }
                else {
                    // Log developer security warning for default User-Agent fingerprinting fallback
                    console.warn("[secure-web-token] SECURITY WARNING: No custom getFingerprint function provided. " +
                        "Falling back to weak HTTP User-Agent fingerprinting which is vulnerable to device spoofing.");
                    fingerprint = req.headers["user-agent"] || "";
                }
            }
            // Extract client DPoP headers if present
            const clientSignature = req.headers["x-client-signature"];
            const clientPayload = req.headers["x-client-payload"];
            // Verify the token using our core async verify function
            const payload = await (0, verify_1.default)(token, options.secret, {
                sessionId: requireSession ? sessionId : undefined,
                fingerprint: requireSession ? useFingerprint : undefined,
                clientFingerprint: fingerprint,
                store: requireSession ? (storeInstance || undefined) : undefined,
                auditLogger: options.auditLogger,
                encryptionSecret: options.encryptionSecret,
                clientSignature: typeof clientSignature === "string" ? clientSignature : undefined,
                clientPayload: typeof clientPayload === "string" ? clientPayload : undefined,
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
