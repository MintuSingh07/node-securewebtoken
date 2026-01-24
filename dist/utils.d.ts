/**
 * Encode data into Base64URL format.
 * Used to make tokens URL-safe.
 *
 * @param input - Buffer or string to encode
 * @returns Base64URL encoded string
 */
export declare function base64urlEncode(input: Buffer | string): string;
/**
 * Decode Base64URL encoded data back into Buffer.
 *
 * @param input - Base64URL string
 * @returns Decoded Buffer
 */
export declare function base64urlDecode(input: string): Buffer;
/**
 * Create a SHA-256 hash.
 * Useful for hashing fingerprints or secrets.
 *
 * @param data - String or Buffer to hash
 * @returns SHA-256 hash Buffer
 */
export declare function hash(data: string | Buffer): Buffer;
/**
 * Compare two buffers in constant time.
 * Prevents timing attacks.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns True if equal, false otherwise
 */
export declare function timingSafeEqual(a: Buffer, b: Buffer): boolean;
//# sourceMappingURL=utils.d.ts.map