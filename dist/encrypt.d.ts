/**
 * Encrypts payload using AES-256-GCM.
 * Payload is fully encrypted (unlike JWT).
 *
 * @param payload - Object to encrypt
 * @param secret - Secret key
 * @returns Encrypted Base64URL string
 */
export default function encrypt(payload: Record<string, any>, secret: string): string;
//# sourceMappingURL=encrypt.d.ts.map