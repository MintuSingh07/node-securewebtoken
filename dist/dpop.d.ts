/**
 * Computes the JWK Thumbprint (RFC 7638) for an EC public key.
 * Creates a SHA-256 hash of the canonical JSON representation
 * of the required JWK members (sorted alphabetically).
 *
 * @param jwk - The JSON Web Key object (must be an EC key with crv, kty, x, y)
 * @returns Base64URL-encoded SHA-256 thumbprint
 */
export declare function computeJwkThumbprint(jwk: Record<string, any>): string;
/**
 * Parsed and verified DPoP proof result.
 */
export interface DpopProofResult {
    /** The public key JWK from the proof */
    jwk: Record<string, any>;
    /** The parsed payload (url, method, timestamp) */
    payload: {
        url: string;
        method: string;
        timestamp: number;
    };
    /** The computed JWK thumbprint */
    thumbprint: string;
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
export declare function verifyDpopProof(proofString: string, expectedThumbprint: string, maxAge?: number): DpopProofResult;
//# sourceMappingURL=dpop.d.ts.map