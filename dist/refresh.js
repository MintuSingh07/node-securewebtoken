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
        // 1. Verify and decrypt the refresh token (including DPoP if bound)
        const payload = await (0, verify_1.default)(refreshToken, secret, {
            sessionId: options.sessionId,
            store: options.store,
            dpopProof: options.dpopProof,
            auditLogger: options.auditLogger,
        });
        // 2. Assert that this is indeed a refresh token
        if (payload.isRefresh !== true) {
            throw new Error("Invalid token type: not a refresh token");
        }
        const userId = payload.data?.userId;
        if (!userId) {
            throw new Error("Invalid refresh token payload: missing userId");
        }
        // 3. Determine if the token was DPoP-bound
        const hasDpop = !!(payload.cnf && payload.cnf.jkt);
        if (hasDpop && !options.clientPublicKey) {
            throw new Error("clientPublicKey is required to refresh a DPoP-bound token");
        }
        // 4. Generate new rotated Access Token and Refresh Token
        const result = await (0, sign_1.default)({ userId }, secret, {
            expiresIn: options.expiresIn,
            generateRefreshToken: true,
            refreshExpiresIn: options.refreshExpiresIn,
            fingerprint: hasDpop,
            clientPublicKey: hasDpop ? options.clientPublicKey : undefined,
            store: options.store,
            auditLogger: options.auditLogger,
        });
        // Trigger audit log refresh event
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "refresh",
            userId,
            sessionId: options.sessionId,
        });
        return result;
    }
    catch (err) {
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "verify_failure",
            sessionId: options.sessionId,
            reason: err.message || "Refresh failed",
        });
        throw err;
    }
}
