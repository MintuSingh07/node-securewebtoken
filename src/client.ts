function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  throw new Error("[secure-web-token] Web Crypto API is not available in this environment.");
}

/**
 * Generates a browser-compatible P-256 ECDSA key pair.
 * Returns the public key as JWK and the private key as a CryptoKey object.
 */
export async function generateDpopKey(): Promise<{
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
}> {
  const cryptoObj = getCrypto();
  const keyPair = await cryptoObj.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // extractable: false (highly secure, cannot be stolen via XSS)
    ["sign", "verify"]
  ) as CryptoKeyPair;
  const publicKeyJwk = await cryptoObj.subtle.exportKey("jwk", keyPair.publicKey);
  return {
    publicKeyJwk,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Signs the request payload and generates the DPoP signature and payload headers.
 * Converts the raw browser Web Crypto signature to ASN.1 DER format.
 */
export async function createDpopHeaders(
  privateKey: CryptoKey,
  url: string,
  method: string
): Promise<{
  "x-client-signature": string;
  "x-client-payload": string;
}> {
  if (!privateKey) {
    throw new Error("[secure-web-token] Private key is required to sign DPoP payload.");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const clientPayloadObj = { url, method: method.toUpperCase(), timestamp };
  const clientPayloadStr = JSON.stringify(clientPayloadObj);

  const encoder = new TextEncoder();
  const cryptoObj = getCrypto();
  const rawSignature = await cryptoObj.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    encoder.encode(clientPayloadStr)
  );

  const derSignature = rawToDer(rawSignature);
  const signatureBase64 = btoa(String.fromCharCode(...derSignature));
  const signatureBase64Url = signatureBase64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return {
    "x-client-signature": signatureBase64Url,
    "x-client-payload": clientPayloadStr,
  };
}

/**
 * Converts raw browser Web Crypto P-256 ECDSA signature (IEEE P1363 raw R/S concatenation) to ASN.1 DER format.
 */
function rawToDer(rawSignatureBuffer: ArrayBuffer): Uint8Array {
  const raw = new Uint8Array(rawSignatureBuffer);
  if (raw.length !== 64) {
    throw new Error("Only P-256 signatures are supported");
  }
  let r = raw.slice(0, 32);
  let s = raw.slice(32, 64);
  let rOffset = 0;
  while (rOffset < r.length - 1 && r[rOffset] === 0) rOffset++;
  r = r.slice(rOffset);
  let sOffset = 0;
  while (sOffset < s.length - 1 && s[sOffset] === 0) sOffset++;
  s = s.slice(sOffset);
  let rBytes = Array.from(r);
  if (r[0] >= 0x80) rBytes.unshift(0x00);
  let sBytes = Array.from(s);
  if (s[0] >= 0x80) sBytes.unshift(0x00);
  const derBytes = [
    0x30,
    2 + rBytes.length + 2 + sBytes.length,
    0x02,
    rBytes.length,
    ...rBytes,
    0x02,
    sBytes.length,
    ...sBytes
  ];
  return new Uint8Array(derBytes);
}
