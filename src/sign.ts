import * as crypto from "crypto";
import encrypt from "./encrypt";
import { base64urlEncode } from "./utils";
import { generateDeviceId } from "./device";
import { getStore, StoreType, Store } from "./store";
import { AuditLogger, logEvent } from "./audit";

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
  fingerprint?: boolean;
  /**
   * The unique client fingerprint string (e.g., User-Agent or IP).
   */
  clientFingerprint?: string;
  /**
   * The store type or store instance to use for session persistence.
   */
  store?: StoreType | Store;
  /**
   * Whether to generate a refresh token alongside the access token.
   */
  generateRefreshToken?: boolean;
  /**
   * Refresh token expiration time in seconds. Defaults to 604800 (7 days).
   */
  refreshExpiresIn?: number;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
  /**
   * Pre-existing device ID to bind. If not provided and fingerprint is true, generates a new one.
   */
  deviceId?: string;
  /**
   * Pre-existing session ID to bind.
   */
  sessionId?: string;
}

/**
 * Signs a payload to create a Secure Web Token (SWT).
 * 
 * @param data - The object to be encrypted in the token. Must include `userId` if using fingerprint/session mode.
 * @param secret - The secret key used for encryption and HMAC signing.
 * @param options - Configuration options for the token.
 * 
 * @returns An object containing the generated `token`, optional `sessionId`, and optional `refreshToken`.
 */
export default async function sign(
  data: Record<string, any>,
  secret: string,
  options: SignOptions = {}
): Promise<{ token: string; sessionId?: string; refreshToken?: string }> {

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
  if (options.fingerprint || options.deviceId) {
    deviceId = options.deviceId ?? generateDeviceId();
    payload.fp = deviceId;
    sessionId = options.sessionId ?? crypto.randomUUID();

    // Resolve store instance (support direct Store injection or store type string)
    const store = typeof options.store === "string" ? getStore(options.store) : options.store;
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

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encryptedPayload = encrypt(payload, secret);
  const dataToSign = `${encodedHeader}.${encryptedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64url");

  const token = `${dataToSign}.${signature}`;

  let refreshToken: string | undefined;

  if (options.generateRefreshToken === true) {
    const refreshPayload: Record<string, any> = {
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

    const encodedRefreshHeader = base64urlEncode(JSON.stringify(refreshHeader));
    const encryptedRefreshPayload = encrypt(refreshPayload, secret);
    const refreshDataToSign = `${encodedRefreshHeader}.${encryptedRefreshPayload}`;

    const refreshSignature = crypto
      .createHmac("sha256", secret)
      .update(refreshDataToSign)
      .digest("base64url");

    refreshToken = `${refreshDataToSign}.${refreshSignature}`;
  }

  // Trigger audit log event
  await logEvent(options.auditLogger, {
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

