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
const audit_1 = require("./audit");
const dpop_1 = require("./dpop");
/**
 * Verifies and decrypts a Secure Web Token (SWT).
 *
 * @param token - The SWT string to verify.
 * @param secretOrPublicKey - The secret key (or PEM Public Key) used for decryption and signature verification.
 * @param options - Verification options.
 *
 * @returns The decrypted payload data.
 * @throws {Error} If the token is invalid, expired, session is revoked, or DPoP verification fails.
 */
async function verify(token, secretOrPublicKey, options = {}) {
    try {
        if (!token || typeof token !== "string")
            throw new Error("Token must be string");
        const parts = token.split(".");
        if (parts.length !== 3)
            throw new Error("Invalid token format");
        const [headerB64, encryptedPayload, signature] = parts;
        // Fast pre-decryption expiration validation
        const headerStr = (0, utils_1.base64urlDecode)(headerB64).toString("utf8");
        let headerObj;
        try {
            headerObj = JSON.parse(headerStr);
        }
        catch {
            throw new Error("Invalid token header");
        }
        const now = Math.floor(Date.now() / 1000);
        if (headerObj.exp && headerObj.exp < now) {
            throw new Error("Token expired");
        }
        const dataToVerify = `${headerB64}.${encryptedPayload}`;
        const isPem = secretOrPublicKey.includes("-----BEGIN");
        if (isPem) {
            // Asymmetric signature verification (RSA-SHA256)
            const verifier = crypto.createVerify("SHA256");
            verifier.update(dataToVerify);
            const isValid = verifier.verify(secretOrPublicKey, signature, "base64url");
            if (!isValid)
                throw new Error("Invalid signature");
        }
        else {
            // Symmetric signature verification (HMAC-SHA256)
            const expectedSignature = crypto
                .createHmac("sha256", secretOrPublicKey)
                .update(dataToVerify)
                .digest("base64url");
            if (!(0, utils_1.timingSafeEqual)(Buffer.from(signature), Buffer.from(expectedSignature)))
                throw new Error("Invalid signature");
        }
        const encSecret = options.encryptionSecret || secretOrPublicKey;
        const payload = (0, decrypt_1.default)(encryptedPayload, encSecret);
        // Double check payload expiration (fallback security)
        if (payload.exp < now)
            throw new Error("Token expired");
        if (!payload.data || typeof payload.data !== "object")
            throw new Error("Invalid payload");
        // Session revocation check (Redis)
        if (options.sessionId) {
            if (!options.store)
                throw new Error("Store is required when sessionId is provided");
            const session = await options.store.getSession(options.sessionId);
            if (!session)
                throw new Error("Session revoked or invalid");
            if (session.userId !== payload.data.userId)
                throw new Error("User mismatch");
            // Cross-check DPoP thumbprint stored in Redis vs token payload
            if (session.jkt && payload.cnf?.jkt) {
                if (session.jkt !== payload.cnf.jkt) {
                    throw new Error("DPoP key binding mismatch between session and token");
                }
            }
        }
        // DPoP proof-of-possession verification (when token is DPoP-bound)
        if (payload.cnf && payload.cnf.jkt) {
            if (!options.dpopProof) {
                throw new Error("DPoP proof required for this token");
            }
            (0, dpop_1.verifyDpopProof)(options.dpopProof, payload.cnf.jkt);
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
