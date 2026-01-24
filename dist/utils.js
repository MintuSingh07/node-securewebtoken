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
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64urlEncode = base64urlEncode;
exports.base64urlDecode = base64urlDecode;
exports.hash = hash;
exports.timingSafeEqual = timingSafeEqual;
const crypto = __importStar(require("crypto"));
/**
 * Encode data into Base64URL format.
 * Used to make tokens URL-safe.
 *
 * @param input - Buffer or string to encode
 * @returns Base64URL encoded string
 */
function base64urlEncode(input) {
    return Buffer.from(input).toString("base64url");
}
/**
 * Decode Base64URL encoded data back into Buffer.
 *
 * @param input - Base64URL string
 * @returns Decoded Buffer
 */
function base64urlDecode(input) {
    return Buffer.from(input, "base64url");
}
/**
 * Create a SHA-256 hash.
 * Useful for hashing fingerprints or secrets.
 *
 * @param data - String or Buffer to hash
 * @returns SHA-256 hash Buffer
 */
function hash(data) {
    return crypto.createHash("sha256").update(data).digest();
}
/**
 * Compare two buffers in constant time.
 * Prevents timing attacks.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns True if equal, false otherwise
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return crypto.timingSafeEqual(a, b);
}
