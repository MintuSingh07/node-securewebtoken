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
exports.default = sign;
const crypto = __importStar(require("crypto"));
const encrypt_1 = __importDefault(require("./encrypt"));
const utils_1 = require("./utils");
const audit_1 = require("./audit");
const dpop_1 = require("./dpop");
/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId`.
 * @param secretOrPrivateKey - The secret key (or PEM Private Key) used for encryption and signing.
 * @param options - Configuration options for the token.
 *
 * @returns An object containing the generated `token`, optional `sessionId`, and optional `refreshToken`.
 */
async function sign(data, secretOrPrivateKey, options = {}) {
    if (!secretOrPrivateKey || typeof secretOrPrivateKey !== "string")
        throw new Error("Secret or Private Key required");
    if (!data || typeof data !== "object")
        throw new Error("Data must be object");
    if (!data.userId)
        throw new Error("data.userId is required");
    // Fingerprint mode requires both store and clientPublicKey
    if (options.fingerprint) {
        if (!options.store)
            throw new Error("Store (RedisStore) is required when fingerprint is enabled");
        if (!options.clientPublicKey)
            throw new Error("clientPublicKey is required when fingerprint is enabled");
    }
    const isPem = secretOrPrivateKey.includes("-----BEGIN");
    const encSecret = options.encryptionSecret || secretOrPrivateKey;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (options.expiresIn ?? 900);
    const payload = {
        data,
        iat: now,
        exp,
    };
    // DPoP binding: compute JWK Thumbprint and embed in encrypted payload
    let jkt;
    if (options.fingerprint) {
        const jwk = typeof options.clientPublicKey === "string"
            ? JSON.parse(options.clientPublicKey)
            : options.clientPublicKey;
        jkt = (0, dpop_1.computeJwkThumbprint)(jwk);
        payload.cnf = { jkt };
    }
    // Session registration in Redis (for revocation + DPoP key binding)
    let sessionId;
    if (options.store) {
        sessionId = crypto.randomUUID();
        await options.store.registerSession({
            sessionId,
            userId: data.userId,
            ...(jkt ? { jkt } : {}),
        });
    }
    const header = {
        alg: isPem ? "RS256" : "AES-256-GCM+HMAC",
        typ: "SWT",
        exp, // Exposed in header for fast pre-decryption expiry check
    };
    const encodedHeader = (0, utils_1.base64urlEncode)(JSON.stringify(header));
    const encryptedPayload = (0, encrypt_1.default)(payload, encSecret);
    const dataToSign = `${encodedHeader}.${encryptedPayload}`;
    let signature;
    if (isPem) {
        const signer = crypto.createSign("SHA256");
        signer.update(dataToSign);
        signature = signer.sign(secretOrPrivateKey, "base64url");
    }
    else {
        signature = crypto
            .createHmac("sha256", secretOrPrivateKey)
            .update(dataToSign)
            .digest("base64url");
    }
    const token = `${dataToSign}.${signature}`;
    let refreshToken;
    if (options.generateRefreshToken === true) {
        const refreshExp = now + (options.refreshExpiresIn ?? 604800);
        const refreshPayload = {
            data: { userId: data.userId },
            iat: now,
            exp: refreshExp,
            isRefresh: true,
        };
        // Bind refresh token to the same DPoP key
        if (jkt) {
            refreshPayload.cnf = { jkt };
        }
        const refreshHeader = {
            alg: isPem ? "RS256" : "AES-256-GCM+HMAC",
            typ: "SWT-Refresh",
            exp: refreshExp,
        };
        const encodedRefreshHeader = (0, utils_1.base64urlEncode)(JSON.stringify(refreshHeader));
        const encryptedRefreshPayload = (0, encrypt_1.default)(refreshPayload, encSecret);
        const refreshDataToSign = `${encodedRefreshHeader}.${encryptedRefreshPayload}`;
        let refreshSignature;
        if (isPem) {
            const signer = crypto.createSign("SHA256");
            signer.update(refreshDataToSign);
            refreshSignature = signer.sign(secretOrPrivateKey, "base64url");
        }
        else {
            refreshSignature = crypto
                .createHmac("sha256", secretOrPrivateKey)
                .update(refreshDataToSign)
                .digest("base64url");
        }
        refreshToken = `${refreshDataToSign}.${refreshSignature}`;
    }
    // Trigger audit log event
    await (0, audit_1.logEvent)(options.auditLogger, {
        event: "sign",
        userId: data.userId,
        sessionId,
    });
    return {
        token,
        sessionId,
        refreshToken,
    };
}
