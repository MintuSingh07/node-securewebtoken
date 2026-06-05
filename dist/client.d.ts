/**
 * Generates a browser-compatible P-256 ECDSA key pair.
 * Returns the public key as JWK and the private key as a CryptoKey object.
 */
export declare function generateDpopKey(): Promise<{
    publicKeyJwk: JsonWebKey;
    privateKey: CryptoKey;
}>;
/**
 * Signs the request payload and generates the DPoP signature and payload headers.
 * Converts the raw browser Web Crypto signature to ASN.1 DER format.
 */
export declare function createDpopHeaders(privateKey: CryptoKey, url: string, method: string): Promise<{
    "x-client-signature": string;
    "x-client-payload": string;
}>;
//# sourceMappingURL=client.d.ts.map