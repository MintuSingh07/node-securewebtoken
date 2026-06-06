/**
 * Generates a browser-compatible P-256 ECDSA key pair for DPoP binding.
 * The private key is non-exportable — it cannot be stolen via XSS.
 *
 * @returns Object containing the exportable public key JWK and the non-exportable private CryptoKey
 */
export declare function generateDpopKey(): Promise<{
    publicKeyJwk: JsonWebKey;
    privateKey: CryptoKey;
}>;
/**
 * Creates a self-contained DPoP proof for a specific request.
 * The proof contains the public key, request metadata, and an ECDSA signature.
 * Send this as the single `x-dpop-proof` header with your API request.
 *
 * @param privateKey - The non-exportable CryptoKey from generateDpopKey()
 * @param publicKeyJwk - The public key JWK from generateDpopKey()
 * @param url - The request URL being authorized
 * @param method - The HTTP method (GET, POST, etc.)
 * @returns Base64URL-encoded self-contained DPoP proof string
 */
export declare function createDpopProof(privateKey: CryptoKey, publicKeyJwk: JsonWebKey, url: string, method: string): Promise<string>;
//# sourceMappingURL=client.d.ts.map