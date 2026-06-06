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
exports.computeJwkThumbprint = computeJwkThumbprint;
exports.verifyDpopProof = verifyDpopProof;
const crypto = __importStar(require("crypto"));
/**
 * Computes the JWK Thumbprint (RFC 7638) for an EC public key.
 * Creates a SHA-256 hash of the canonical JSON representation
 * of the required JWK members (sorted alphabetically).
 *
 * @param jwk - The JSON Web Key object (must be an EC key with crv, kty, x, y)
 * @returns Base64URL-encoded SHA-256 thumbprint
 */
function computeJwkThumbprint(jwk) {
    // RFC 7638: For EC keys, required members are: crv, kty, x, y (alphabetical order)
    if (!jwk.crv || !jwk.kty || !jwk.x || !jwk.y) {
        throw new Error("Invalid JWK: missing required EC key members (crv, kty, x, y)");
    }
    const canonical = JSON.stringify({
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x,
        y: jwk.y,
    });
    return crypto
        .createHash("sha256")
        .update(canonical)
        .digest("base64url");
}
/**
 * Verifies a self-contained DPoP proof string against an expected JWK Thumbprint.
 *
 * Verification steps:
 *   1. Decodes the base64url proof and extracts jwk, payload, signature
 *   2. Computes JWK thumbprint of the proof's public key
 *   3. Matches computed thumbprint against the token's cnf.jkt
 *   4. Verifies the ECDSA signature over the payload using the proof's public key
 *   5. Checks timestamp freshness (anti-replay)
 *
 * @param proofString - The base64url-encoded DPoP proof from the client's x-dpop-proof header
 * @param expectedThumbprint - The cnf.jkt value extracted from the decrypted token payload
 * @param maxAge - Maximum age of the proof in seconds (default: 300 = 5 minutes)
 * @returns The verified proof result containing the JWK, parsed payload, and thumbprint
 * @throws {Error} If verification fails at any step
 */
function verifyDpopProof(proofString, expectedThumbprint, maxAge = 300) {
    // 1. Decode the self-contained proof
    let proof;
    try {
        const decoded = Buffer.from(proofString, "base64url").toString("utf8");
        proof = JSON.parse(decoded);
    }
    catch {
        throw new Error("Invalid DPoP proof format");
    }
    if (!proof.jwk || !proof.payload || !proof.signature) {
        throw new Error("Incomplete DPoP proof: missing jwk, payload, or signature");
    }
    // 2. Compute thumbprint of the proof's public key and match against token binding
    const thumbprint = computeJwkThumbprint(proof.jwk);
    if (thumbprint !== expectedThumbprint) {
        throw new Error("DPoP key mismatch: proof key does not match token binding");
    }
    // 3. Verify the ECDSA signature using the embedded public key
    try {
        const publicKey = crypto.createPublicKey({
            key: proof.jwk,
            format: "jwk",
        });
        const verifier = crypto.createVerify("SHA256");
        verifier.update(proof.payload);
        const isValid = verifier.verify(publicKey, proof.signature, "base64url");
        if (!isValid) {
            throw new Error("DPoP signature verification failed");
        }
    }
    catch (err) {
        if (err.message.includes("DPoP"))
            throw err;
        throw new Error(`DPoP verification error: ${err.message}`);
    }
    // 4. Check timestamp freshness (anti-replay protection)
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(proof.payload);
    }
    catch {
        throw new Error("Invalid DPoP proof payload format");
    }
    const now = Math.floor(Date.now() / 1000);
    if (!parsedPayload.timestamp || Math.abs(now - parsedPayload.timestamp) > maxAge) {
        throw new Error("DPoP proof expired or timestamp invalid");
    }
    return {
        jwk: proof.jwk,
        payload: parsedPayload,
        thumbprint,
    };
}
