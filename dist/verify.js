"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = verify;
const crypto = __importStar(require("crypto"));
const decrypt_1 = __importDefault(require("./decrypt"));
const utils_1 = require("./utils");
const store_1 = require("./store");
const audit_1 = require("./audit");
/**
 * Verifies and decrypts a Secure Web Token (SWT).
 *
 * @param token - The SWT string to verify.
 * @param secret - The secret key used for decryption and signature verification.
 * @param options - Verification options.
 *
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, or session verification fails.
 */
async function verify(token, secret, options = {}) {
    try {
        if (!token || typeof token !== "string")
            throw new Error("Token must be string");
        const parts = token.split(".");
        if (parts.length !== 3)
            throw new Error("Invalid token format");
        const [header, encryptedPayload, signature] = parts;
        const dataToVerify = `${header}.${encryptedPayload}`;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(dataToVerify)
            .digest("base64url");
        if (!(0, utils_1.timingSafeEqual)(Buffer.from(signature), Buffer.from(expectedSignature)))
            throw new Error("Invalid signature");
        const payload = (0, decrypt_1.default)(encryptedPayload, secret);
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now)
            throw new Error("Token expired");
        if (!payload.data || typeof payload.data !== "object")
            throw new Error("Invalid payload");
        // Server-side session verification
        if (payload.fp || options.sessionId || options.fingerprint) {
            if (!options.sessionId) {
                throw new Error("Session ID is required for device-bound tokens");
            }
            const store = typeof options.store === "string" ? (0, store_1.getStore)(options.store) : options.store;
            if (!store)
                throw new Error("No store available");
            const session = await store.getSession(options.sessionId);
            if (!session)
                throw new Error("Session revoked or invalid");
            if (session.userId !== payload.data.userId)
                throw new Error("User mismatch");
            const expectedFingerprint = options.clientFingerprint ?? payload.fp;
            if (session.fingerprint !== expectedFingerprint)
                throw new Error("Device mismatch");
        }
        // Trigger audit log success event
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "verify_success",
            userId: payload.data?.userId,
            sessionId: options.sessionId,
        });
        return payload;
    }
    catch (err) {
        // Trigger audit log failure event
        await (0, audit_1.logEvent)(options.auditLogger, {
            event: "verify_failure",
            sessionId: options.sessionId,
            reason: err.message || "Verification failed",
        });
        throw err;
    }
}
