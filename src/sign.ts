import * as crypto from "crypto";
import encrypt from "./encrypt";
import { base64urlEncode } from "./utils";
import { generateDeviceId } from "./device";
import { getStore, StoreType } from "./store";

export interface SignOptions {
  expiresIn?: number;
  fingerprint?: true; // enable device/session mode
  store?: StoreType;
}

/**
 * sign() now returns:
 * - token (encrypted payload)
 * - sessionId (to store in HttpOnly cookie)
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
