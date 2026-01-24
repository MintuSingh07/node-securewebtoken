import * as crypto from "crypto";
import encrypt from "./encrypt";
import { base64urlEncode } from "./utils";
import { generateDeviceId } from "./device";
import { getStore, StoreType } from "./store";

/**
 * Options for signing a Secure Web Token.
 */
export interface SignOptions {
  /**
   * Token expiration time in seconds. Defaults to 900 (15 minutes).
   */
  expiresIn?: number;
  /**
   * Whether to enable fingerprint/session mode. If true, generates a device-bound session.
   */
  fingerprint?: true; // enable device/session mode
  /**
   * The store type to use for session persistence.
   */
  store?: StoreType;
}

/**
 * Signs a payload to create a Secure Web Token (SWT).
 * 
 * @param data - The object to be encrypted in the token. Must include `userId` if using fingerprint/session mode.
 * @param secret - The secret key used for encryption and HMAC signing.
 * @param options - Configuration options for the token.
 * @param options.expiresIn - Token expiration time in seconds (default: 900).
 * @param options.fingerprint - Set to true to enable device-bound session mode.
 * @param options.store - The store type to use for session persistence (e.g., 'memory').
 * 
 * @returns An object containing the generated `token` and an optional `sessionId` if fingerprinting is enabled.
 * 
 * @example
 * const { token, sessionId } = sign({ userId: '123' }, 'my-secret', { fingerprint: true });
 */
export default function sign(
  data: Record<string, any>,
  secret: string,
  options: SignOptions = {}
): { token: string; sessionId?: string } {

  if (!secret || typeof secret !== "string") throw new Error("Secret required");
  if (!data || typeof data !== "object") throw new Error("Data must be object");
  if (!data.userId) throw new Error("data.userId is required for session mode");

  const now = Math.floor(Date.now() / 1000);

  const payload: Record<string, any> = {
    data,
    iat: now,
    exp: now + (options.expiresIn ?? 900),
  };

  let sessionId: string | undefined;
  let deviceId: string | undefined;

  // Backend-only device/session mode
  if (options.fingerprint === true) {
    deviceId = generateDeviceId();
    payload.fp = deviceId;
    sessionId = crypto.randomUUID();

    const store = getStore(options.store);
    if (store) {
      store.registerSession({
        sessionId,
        userId: data.userId,
        deviceId,
        fingerprint: deviceId,
      });
    }
  }

  const header = {
    alg: "AES-256-GCM+HMAC",
    typ: "SWT",
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encryptedPayload = encrypt(payload, secret);
  const dataToSign = `${encodedHeader}.${encryptedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64url");

  return {
    token: `${dataToSign}.${signature}`,
    sessionId, // to set in HttpOnly cookie
  };
}
