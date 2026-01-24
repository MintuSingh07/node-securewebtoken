import * as crypto from "crypto";
import decrypt from "./decrypt";
import { timingSafeEqual } from "./utils";
import { getStore, StoreType } from "./store";

export interface VerifyOptions {
  sessionId?: string; // read from HttpOnly cookie
  fingerprint?: string;
  store?: StoreType;
}

export default function verify(
  token: string,
  secret: string,
  options: VerifyOptions = {}
): Record<string, any> {

  if (!token || typeof token !== "string") throw new Error("Token must be string");

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [header, encryptedPayload, signature] = parts;
  const dataToVerify = `${header}.${encryptedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(dataToVerify)
    .digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)))
    throw new Error("Invalid signature");

  const payload = decrypt(encryptedPayload, secret);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) throw new Error("Token expired");
  if (!payload.data || typeof payload.data !== "object") throw new Error("Invalid payload");

  // Server-side session verification
  if (options.sessionId && options.fingerprint) {
    const store = getStore(options.store);
    if (!store) throw new Error("No store available");

    const session = store.getSession(options.sessionId);
    if (!session) throw new Error("Session revoked or invalid");
    if (session.userId !== payload.data.userId) throw new Error("User mismatch");
    if (session.fingerprint !== options.fingerprint) throw new Error("Device mismatch");
  }

  return payload;
}
