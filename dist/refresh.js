"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = refresh;
const verify_1 = __importDefault(require("./verify"));
const sign_1 = __importDefault(require("./sign"));
const audit_1 = require("./audit");
/**
 * Verifies a refresh token and generates a new access token and rotated refresh token.
 *
 * @param refreshToken - The signed refresh token string.
 * @param secret - The secret key used for verification and signing.
 * @param options - Configuration options.
 *
 * @returns An object containing the new `token`, optional `sessionId`, and new `refreshToken`.
 */
async function refresh(refreshToken, secret, options = {}) {
    try {
        if (!refreshToken)
            throw new Error("Refresh token required");
        // 1. Verify and decrypt the refresh token.
        // If sessionId and fingerprint are provided, verify() will automatically check them.
        const payload = await (0, verify_1.default)(refreshToken, secret, {
            sessionId: options.sessionId,
            fingerprint: options.fingerprint,
            store: options.store,
            auditLogger: options.auditLogger, // Let verify handle audit logging internally
        });
        // 2. Assert that this is indeed a refresh token
        if (payload.isRefresh !== true) {
            throw new Error("Invalid token type: not a refresh token");
        }
        const userId = payload.data?.userId;
        if (!userId) {
            throw new Error("Invalid refresh token payload: missing userId");
        }
        // 3. Generate a new rotated Access Token and new Refresh Token.
        // Reuse the exact same device/session ID so we don't duplicate sessions or break XSS cookies.
        const result = await (0, sign_1.default)({ userId }, secret, {
            expiresIn: options.expiresIn,
            generateRefreshToken: true,
            refreshExpiresIn: options.refreshExpiresIn,
            fingerprint: !!payload.fp,
            deviceId: payload.fp, // Keep the same device fingerprint binding!
            sessionId: options.sessionId, // Keep the same session ID!
            store: options.store,
            auditLogger: options.auditLogger,
        });
        // Trigger audit log refresh event
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "refresh",
            userId,
            sessionId: options.sessionId,
            deviceId: payload.fp,
        });
        return result;
    }
    catch (err) {
        // Audit log failure is already handled inside verify() if it failed there,
        // but if it failed in step 2 or 3, we log a verify_failure here:
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "verify_failure",
            sessionId: options.sessionId,
            reason: err.message || "Refresh failed",
        });
        throw err;
    }
}
