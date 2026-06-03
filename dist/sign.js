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
const device_1 = require("./device");
const store_1 = require("./store");
const audit_1 = require("./audit");
/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId` if using fingerprint/session mode.
 * @param secret - The secret key used for encryption and HMAC signing.
 * @param options - Configuration options for the token.
 *
 * @returns An object containing the generated `token`, optional `sessionId`, and optional `refreshToken`.
 */
async function sign(data, secret, options = {}) {
    if (!secret || typeof secret !== "string")
        throw new Error("Secret required");
    if (!data || typeof data !== "object")
        throw new Error("Data must be object");
    if (!data.userId)
        throw new Error("data.userId is required for session mode");
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        data,
        iat: now,
        exp: now + (options.expiresIn ?? 900),
    };
    let sessionId;
    let deviceId;
    // Backend-only device/session mode
    if (options.fingerprint || options.deviceId) {
        deviceId = options.deviceId ?? (0, device_1.generateDeviceId)();
        payload.fp = deviceId;
        sessionId = options.sessionId ?? crypto.randomUUID();
        // Resolve store instance (support direct Store injection or store type string)
        const store = typeof options.store === "string" ? (0, store_1.getStore)(options.store) : options.store;
        if (store && !options.sessionId) {
            await store.registerSession({
                sessionId,
                userId: data.userId,
                deviceId,
                fingerprint: options.clientFingerprint ?? deviceId,
            });
        }
    }
    const header = {
        alg: "AES-256-GCM+HMAC",
        typ: "SWT",
    };
    const encodedHeader = (0, utils_1.base64urlEncode)(JSON.stringify(header));
    const encryptedPayload = (0, encrypt_1.default)(payload, secret);
    const dataToSign = `${encodedHeader}.${encryptedPayload}`;
    const signature = crypto
        .createHmac("sha256", secret)
        .update(dataToSign)
        .digest("base64url");
    const token = `${dataToSign}.${signature}`;
    let refreshToken;
    if (options.generateRefreshToken === true) {
        const refreshPayload = {
            data: { userId: data.userId },
            iat: now,
            exp: now + (options.refreshExpiresIn ?? 604800), // Default to 7 days
            isRefresh: true,
        };
        if (deviceId) {
            refreshPayload.fp = deviceId;
        }
        const refreshHeader = {
            alg: "AES-256-GCM+HMAC",
            typ: "SWT-Refresh",
        };
        const encodedRefreshHeader = (0, utils_1.base64urlEncode)(JSON.stringify(refreshHeader));
        const encryptedRefreshPayload = (0, encrypt_1.default)(refreshPayload, secret);
        const refreshDataToSign = `${encodedRefreshHeader}.${encryptedRefreshPayload}`;
        const refreshSignature = crypto
            .createHmac("sha256", secret)
            .update(refreshDataToSign)
            .digest("base64url");
        refreshToken = `${refreshDataToSign}.${refreshSignature}`;
    }
    // Trigger audit log event
    await (0, audit_1.logEvent)(options.auditLogger, {
        event: "sign",
        userId: data.userId,
        sessionId,
        deviceId,
    });
    return {
        token,
        sessionId,
        refreshToken,
    };
}
