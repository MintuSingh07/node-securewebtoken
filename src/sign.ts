import * as crypto from "crypto";
import encrypt from "./encrypt";
import { base64urlEncode } from "./utils";
import { Store } from "./store";
import { AuditLogger, logEvent } from "./audit";
import { computeJwkThumbprint } from "./dpop";

/**
 * Options for signing a Secure Web Token.
 */
export interface SignOptions {
  /**
   * Token expiration time in seconds. Defaults to 900 (15 minutes).
   */
  expiresIn?: number;
  /**
   * Whether to enable DPoP (Proof-of-Possession) binding.
   * When true, requires `clientPublicKey` and `store`.
   * Under the hood: computes JWK Thumbprint, embeds cnf.jkt in the token,
   * and registers the binding in Redis for session revocation.
   */
  fingerprint?: boolean;
  /**
   * The client's public key (JWK format) from the browser's Web Crypto API.
   * Required when fingerprint is true. Accepts a JWK object or JSON string.
   */
  clientPublicKey?: string | Record<string, any>;
  /**
   * Redis store instance for session persistence and revocation.
   * Required when fingerprint is true.
   */
  store?: Store;
  /**
   * Whether to generate a refresh token alongside the access token.
   */
  generateRefreshToken?: boolean;
  /**
   * Refresh token expiration time in seconds. Defaults to 604800 (7 days).
   */
  refreshExpiresIn?: number;
  /**
   * Separate payload encryption key. Mandatory if using asymmetric keys.
   */
  encryptionSecret?: string;
  /**
   * Optional logger callback for security and audit events.
   */
  auditLogger?: AuditLogger;
}

/**
 * Signs a payload to create a Secure Web Token (SWT).
 *
 * @param data - The object to be encrypted in the token. Must include `userId`.
 * @param secretOrPrivateKey - The secret key (or PEM Private Key) used for encryption and signing.
 * @param options - Configuration options for the token.
 *
 * @returns An object containing the generated `token`, optional `sessionId`, and optional `refreshToken`.
 */
export default async function sign(
  data: Record<string, any>,
  secretOrPrivateKey: string,
  options: SignOptions = {}
): Promise<{ token: string; sessionId?: string; refreshToken?: string }> {

  if (!secretOrPrivateKey || typeof secretOrPrivateKey !== "string") throw new Error("Secret or Private Key required");
  if (!data || typeof data !== "object") throw new Error("Data must be object");
  if (!data.userId) throw new Error("data.userId is required");

  // Fingerprint mode requires both store and clientPublicKey
  if (options.fingerprint) {
    if (!options.store) throw new Error("Store (RedisStore) is required when fingerprint is enabled");
    if (!options.clientPublicKey) throw new Error("clientPublicKey is required when fingerprint is enabled");
  }

  const isPem = secretOrPrivateKey.includes("-----BEGIN");
  const encSecret = options.encryptionSecret || secretOrPrivateKey;

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (options.expiresIn ?? 900);

  const payload: Record<string, any> = {
    data,
    iat: now,
    exp,
  };

  // DPoP binding: compute JWK Thumbprint and embed in encrypted payload
  let jkt: string | undefined;
  if (options.fingerprint) {
    const jwk = typeof options.clientPublicKey === "string"
      ? JSON.parse(options.clientPublicKey as string)
      : options.clientPublicKey;
    jkt = computeJwkThumbprint(jwk);
    payload.cnf = { jkt };
  }

  // Session registration in Redis (for revocation + DPoP key binding)
  let sessionId: string | undefined;
  if (options.store) {
    sessionId = crypto.randomUUID();
    await options.store.registerSession({
      sessionId,
      userId: data.userId,
      ...(jkt ? { jkt } : {}),
    });
  }

  const header = {
    alg: isPem ? "RS256" : "AES-256-GCM+HMAC",
    typ: "SWT",
    exp, // Exposed in header for fast pre-decryption expiry check
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encryptedPayload = encrypt(payload, encSecret);
  const dataToSign = `${encodedHeader}.${encryptedPayload}`;

  let signature: string;
  if (isPem) {
    const signer = crypto.createSign("SHA256");
    signer.update(dataToSign);
    signature = signer.sign(secretOrPrivateKey, "base64url");
  } else {
    signature = crypto
      .createHmac("sha256", secretOrPrivateKey)
      .update(dataToSign)
      .digest("base64url");
  }

  const token = `${dataToSign}.${signature}`;

  let refreshToken: string | undefined;

  if (options.generateRefreshToken === true) {
    const refreshExp = now + (options.refreshExpiresIn ?? 604800);
    const refreshPayload: Record<string, any> = {
      data: { userId: data.userId },
      iat: now,
      exp: refreshExp,
      isRefresh: true,
    };

    // Bind refresh token to the same DPoP key
    if (jkt) {
      refreshPayload.cnf = { jkt };
    }

    const refreshHeader = {
      alg: isPem ? "RS256" : "AES-256-GCM+HMAC",
      typ: "SWT-Refresh",
      exp: refreshExp,
    };

    const encodedRefreshHeader = base64urlEncode(JSON.stringify(refreshHeader));
    const encryptedRefreshPayload = encrypt(refreshPayload, encSecret);
    const refreshDataToSign = `${encodedRefreshHeader}.${encryptedRefreshPayload}`;

    let refreshSignature: string;
    if (isPem) {
      const signer = crypto.createSign("SHA256");
      signer.update(refreshDataToSign);
      refreshSignature = signer.sign(secretOrPrivateKey, "base64url");
    } else {
      refreshSignature = crypto
        .createHmac("sha256", secretOrPrivateKey)
        .update(refreshDataToSign)
        .digest("base64url");
    }

    refreshToken = `${refreshDataToSign}.${refreshSignature}`;
  }

  // Trigger audit log event
  await logEvent(options.auditLogger, {
    event: "sign",
    userId: data.userId,
    sessionId,
  });

  return {
    token,
    sessionId,
    refreshToken,
  };
}
