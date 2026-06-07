# Secure Web Token (SWT)

<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778127677/varient-1-circle_wykez9.png" alt="Secure Web Token Logo" width="100" />
</p>

<p align="center">
  <strong>The secure, AES-256-GCM encrypted, DPoP-bound, Redis-backed authentication framework for Node.js</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/secure-web-token">
    <img src="https://img.shields.io/badge/downloads-50k%2B-orange?logo=npm" alt="Downloads" />
  </a>
  <a href="https://github.com/MintuSingh07/node-securewebtoken/stargazers">
    <img src="https://img.shields.io/github/stars/MintuSingh07/node-securewebtoken?style=flat&logo=github&color=yellow" alt="GitHub Stars" />
  </a>
  <a href="https://www.npmjs.com/package/secure-web-token">
    <img src="https://img.shields.io/badge/node-%3E%3D25.5.0-green?logo=node.js" alt="Node.js Version" />
  </a>
  <a href="https://www.npmjs.com/package/secure-web-token">
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript" alt="TypeScript Ready" />
  </a>
  <a href="https://github.com/MintuSingh07/node-securewebtoken">
    <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-brightgreen" alt="AES-256-GCM" />
  </a>
  <a href="https://snyk.io/test/github/MintuSingh07/node-securewebtoken">
    <img src="https://snyk.io/test/github/MintuSingh07/node-securewebtoken/badge.svg" alt="Known Vulnerabilities" />
  </a>
</p>

<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778126974/downloads-badge_vyp6px.svg" alt="Secure Web Token banner" width="700" />
</p>

---

## Why Secure Web Token (SWT)?

Standard **JSON Web Tokens (JWT)** are stateless bearer tokens that suffer from critical security flaws out-of-the-box:
1. **Zero Privacy:** JWT payloads are merely Base64URL-encoded. Anyone who intercepts the token (e.g., in transit, via logs, or browser extension) can read all user identifiers, email addresses, roles, and scopes in plain text.
2. **Bearer Token Vulnerability:** A standard JWT does not bind the session to a specific device. If a token is stolen via XSS, it can be replayed from any machine, anywhere in the world.
3. **No Native Revocation:** Since standard JWT verification is stateless, you cannot instantly terminate a user's session (e.g., on logout or when account security is compromised). The token remains fully valid until its hardcoded expiration time passes.

**Secure Web Token (SWT)** is a modern, developer-friendly, and highly secure authentication library built for Node.js. It solves these design-level issues under the hood using:
* **AES-256-GCM Encryption:** Payloads are fully encrypted and signed, ensuring absolute confidentiality and tamper-proof integrity.
* **Cryptographic DPoP (Proof-of-Possession) Binding:** Tokens are bound to a non-exportable private key stored securely in the client's browser. Even if an attacker steals the token, it is completely useless without the matching private key.
* **Redis-Backed Session Management:** Provides true session revocation, instant logout, and centralized token invalidation via a low-latency Redis store.

---

## How the Data Flows

SWT establishes a secure validation loop between the **Client (Browser)**, the **Application Server (Node.js)**, and the **Redis Session Store**.

### 1. The Token Issuance & DPoP Binding Flow (Login)

<p align="center">
  <img src="https://mermaid.ink/svg/c2VxdWVuY2VEaWFncmFtCiAgICBhdXRvbnVtYmVyCiAgICBhY3RvciBDbGllbnQgYXMgQ2xpZW50IEJyb3dzZXIKICAgIHBhcnRpY2lwYW50IFNlcnZlciBhcyBBcHBsaWNhdGlvbiBTZXJ2ZXIKICAgIHBhcnRpY2lwYW50IFJlZGlzIGFzIFJlZGlzIFNlc3Npb24gU3RvcmUKCiAgICBOb3RlIG92ZXIgQ2xpZW50OiAxLiBHZW5lcmF0ZSBub24tZXhwb3J0YWJsZSBFQ0RTQSBLZXkgUGFpcgogICAgQ2xpZW50LT4-U2VydmVyOiBQT1NUIC9hcGkvYXV0aC9sb2dpbiAoQ3JlZGVudGlhbHMgKyBDbGllbnQgUHVibGljIEtleSBKV0spCiAgICBhY3RpdmF0ZSBTZXJ2ZXIKICAgIE5vdGUgb3ZlciBTZXJ2ZXI6IDIuIEF1dGhlbnRpY2F0ZSBVc2VyIENyZWRlbnRpYWxzPGJyLz4zLiBDb21wdXRlIEpXSyBUaHVtYnByaW50IChqa3QpPGJyLz40LiBHZW5lcmF0ZSBTZXNzaW9uIElEIChVVUlEKTxici8-NS4gRW5jcnlwdCBQYXlsb2FkICYgc2lnbiBTV1QgKGluY2x1ZGVzIGNuZi5qa3QpCiAgICBTZXJ2ZXItPj5SZWRpczogcmVnaXN0ZXJTZXNzaW9uKHsgc2Vzc2lvbklkLCB1c2VySWQsIGprdCB9KQogICAgYWN0aXZhdGUgUmVkaXMKICAgIFJlZGlzLS0-PlNlcnZlcjogQWNrbm93bGVkZ2Ugc2Vzc2lvbiBzdG9yZWQKICAgIGRlYWN0aXZhdGUgUmVkaXMKICAgIFNlcnZlci0tPj5DbGllbnQ6IDIwMCBPSyAoSldUIEFsdGVybmF0aXZlIFRva2VuICsgSHR0cE9ubHkgU2Vzc2lvbiBDb29raWUpCiAgICBkZWFjdGl2YXRlIFNlcnZlcg" alt="Token Issuance & DPoP Binding Flow" />
</p>

1. **Key Generation:** During app initialization or login, the frontend uses the native Web Crypto API to generate a cryptographic ECDSA (P-256) key pair. The private key is flagged as non-exportable so it cannot be read by any browser script or XSS attack.
2. **Login Request:** The client sends the user credentials along with the serialized **Public Key JWK** to the backend login endpoint.
3. **Token Creation:** The server verifies credentials and uses `sign()` to generate a session UUID, compute the JWK thumbprint (`jkt`), and build an AES-256-GCM encrypted token embedding the thumbprint (`cnf.jkt`).
4. **Session Registration:** The server registers the session details (Session ID, User ID, and the cryptographic JWK Thumbprint) inside the Redis session store.
5. **Secure Dispatch:** The server returns the encrypted SWT token in the HTTP response body, and sets the Session ID as a secure, `HttpOnly`, `SameSite=Strict` cookie.

---

### 2. The Token Verification & Proof-of-Possession Flow (API Request)

<p align="center">
  <img src="https://mermaid.ink/svg/c2VxdWVuY2VEaWFncmFtCiAgICBhdXRvbnVtYmVyCiAgICBhY3RvciBDbGllbnQgYXMgQ2xpZW50IEJyb3dzZXIKICAgIHBhcnRpY2lwYW50IFNlcnZlciBhcyBBcHBsaWNhdGlvbiBTZXJ2ZXIKICAgIHBhcnRpY2lwYW50IFJlZGlzIGFzIFJlZGlzIFNlc3Npb24gU3RvcmUKCiAgICBOb3RlIG92ZXIgQ2xpZW50OiAxLiBTaWduIFJlcXVlc3QgTWV0YWRhdGEgdXNpbmcgUHJpdmF0ZSBLZXk8YnIvPnRvIGdlbmVyYXRlIERQb1AgUHJvb2YKICAgIENsaWVudC0-PlNlcnZlcjogR0VUIC9hcGkvcHJvZmlsZSAoQXV0aG9yaXphdGlvbjogQmVhcmVyICsgQ29va2llOiBzZXNzaW9uSWQgKyB4LWRwb3AtcHJvb2YpCiAgICBhY3RpdmF0ZSBTZXJ2ZXIKICAgIE5vdGUgb3ZlciBTZXJ2ZXI6IDIuIEZhc3QgUHJlLURlY3J5cHRpb24gRXhwaXJ5IENoZWNrIChhbGcvZXhwKTxici8-My4gVmVyaWZ5IEhNQUMgc2lnbmF0dXJlICYgRGVjcnlwdCBwYXlsb2FkPGJyLz40LiBFeHRyYWN0IFNlc3Npb24gSUQgZnJvbSBjb29raWUKICAgIFNlcnZlci0-PlJlZGlzOiBnZXRTZXNzaW9uKHNlc3Npb25JZCkKICAgIGFjdGl2YXRlIFJlZGlzCiAgICBSZWRpcy0tPj5TZXJ2ZXI6IFJldHVybiBzdG9yZWQgc2Vzc2lvbiAoY29udGFpbnMgdXNlcklkICYgamt0KQogICAgZGVhY3RpdmF0ZSBSZWRpcwogICAgTm90ZSBvdmVyIFNlcnZlcjogNS4gTWF0Y2ggdXNlciBJRCBhbmQgY2hlY2sgamt0IGJpbmRzPGJyLz42LiBWZXJpZnkgRFBvUCBwcm9vZiBzaWduYXR1cmUgdXNpbmcgcHVibGljIGtleSBKV0sKICAgIFNlcnZlci0tPj5DbGllbnQ6IDIwMCBPSyAoRGVjcnlwdGVkIFByb3RlY3RlZCBSZXNvdXJjZSBEYXRhKQogICAgZGVhY3RpdmF0ZSBTZXJ2ZXI" alt="Token Verification & Proof-of-Possession Flow" />
</p>

1. **Request Signing (DPoP Proof):** For every API call, the client signs the destination URL, HTTP method, and a timestamp using its non-exportable private key to create a self-contained DPoP proof.
2. **Protected Request:** The client attaches the DPoP proof header (`x-dpop-proof`) and the Bearer token (`Authorization: Bearer <token>`) to the request. The browser automatically appends the HttpOnly `sessionId` cookie.
3. **Pre-Decryption Expiry Shield:** The server middleware checks the token's unencrypted expiration header first. If expired, it rejects the request immediately, avoiding costly decryption computations (protecting against CPU-exhaustion DDoS attacks).
4. **Decryption & Signature Verification:** The server verifies the token signature and decrypts the payload with AES-256-GCM.
5. **Redis Verification:** The server fetches the session metadata from Redis using the Cookie Session ID. It verifies that the session is active and that the token's embedded thumbprint matches the session's registered thumbprint.
6. **Cryptographic Validation:** The server extracts the public key from the client's DPoP proof, verifies that the public key matches the session's thumbprint, and validates the proof's ECDSA signature. If valid, the request is authorized.

---

## Installation

Install the library and its Redis store requirements:

```bash
npm install secure-web-token
```

> [!NOTE]
> Secure Web Token requires Node.js `>=25.5.0` as it leverages native Web Cryptography APIs for maximum performance and security without external dependencies.

---

## Getting Started

### 1. Backend Implementation (Express + Redis)

Use the built-in `swtMiddleware` to secure your routes. It automatically extracts the bearer token, checks the HttpOnly session cookie, matches DPoP proofs, and decrypts the payload.

```javascript
// server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const { createClient } = require("redis");
const { sign, swtMiddleware, RedisStore } = require("secure-web-token");

const app = express();
app.use(express.json());
app.use(cookieParser());

const SECRET = "a_very_secure_and_extremely_long_256_bit_signing_secret_key";

// 1. Initialize Redis Store for Session Validation
const redisClient = createClient({ url: "redis://localhost:6379" });
const sessionStore = new RedisStore(redisClient, {
  prefix: "auth:session:",
  ttl: 86400 // 24-hour session expiration
});

// Connect to Redis
redisClient.connect().then(() => console.log("Redis connected successfully."));

// 2. Authenticate & Generate Tokens (DPoP + Session Bound)
app.post("/api/auth/login", async (req, res) => {
  const { username, password, publicKeyJwk } = req.body;

  // Perform your user database credentials validation here...
  const user = { id: "user_101", username }; 

  try {
    // Generate token and record session state in Redis
    const { token, sessionId } = await sign(
      { userId: user.id, username: user.username },
      SECRET,
      {
        fingerprint: true, // Enable DPoP binding and session state
        clientPublicKey: publicKeyJwk, // Browser public key (JWK format)
        store: sessionStore,
        expiresIn: 900 // Access token lasts 15 minutes
      }
    );

    // Save sessionId in a secure HttpOnly cookie (protects from XSS extraction)
    res.cookie("swt_session", sessionId, {
      httpOnly: true,
      secure: true, // Requires HTTPS in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Failed to issue token: " + error.message });
  }
});

// 3. Secure Endpoint using swtMiddleware (Auto-validates DPoP, session, and decrypts token)
app.get(
  "/api/profile",
  swtMiddleware({
    secret: SECRET,
    store: sessionStore,
    cookieName: "swt_session"
  }),
  (req, res) => {
    // Access decrypted token payload from req.swt
    res.json({
      message: "Access granted to secure profile!",
      user: req.swt
    });
  }
);

// 4. Session Revocation (Instant Logout)
app.post("/api/auth/logout", async (req, res) => {
  const sessionId = req.cookies.swt_session;
  if (sessionId) {
    // Instantly remove session state from Redis
    await sessionStore.revokeSession(sessionId);
  }
  res.clearCookie("swt_session");
  res.json({ message: "Successfully logged out." });
});

app.listen(5001, () => console.log("Server running on port 5001"));
```

---

### 2. Frontend Implementation (Browser)

Import the browser-compatible helpers from `secure-web-token/client` to handle DPoP public/private keys and request signatures.

```javascript
import { generateDpopKey, createDpopProof } from "secure-web-token/client";

// Global variables or state store to hold key-pairs in browser memory
let userKey; // { publicKeyJwk, privateKey }
let accessToken = "";

// 1. Initialize DPoP Keys and Log In
async function login(username, password) {
  // Generate non-exportable keypair in Web Crypto memory
  userKey = await generateDpopKey();

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      publicKeyJwk: userKey.publicKeyJwk // Register public key on backend
    })
  });

  const data = await response.json();
  accessToken = data.token; // Store token in memory
}

// 2. Fetch Protected Resource (Signs metadata dynamically)
async function fetchProfile() {
  const url = "/api/profile";
  const method = "GET";

  // Create cryptographic proof for this specific request
  const proof = await createDpopProof(
    userKey.privateKey,
    userKey.publicKeyJwk,
    url,
    method
  );

  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "x-dpop-proof": proof // Attach proof header
    }
  });

  const profileData = await response.json();
  console.log("Profile details:", profileData);
}
```

---

## Detailed Security Comparison: SWT vs JWT

| Feature / Attack Scenario | JSON Web Token (JWT) | Secure Web Token (SWT) | Security Advantage |
| :--- | :---: | :---: | :--- |
| **Payload Privacy** | ❌ Public (Base64) | ✅ Encrypted (AES-256-GCM) | JWT exposes PII and roles. SWT keeps payload data completely encrypted. |
| **Session Theft (XSS / Network)** | ❌ Token works anywhere | ✅ Rejected (DPoP Proof fails) | Stolen JWT allows complete takeover. Stolen SWT is rejected on device mismatch. |
| **Token Theft & Session Reuse** | ❌ Replayable until expiry | ✅ Blocked (Redis binding check) | If cookie or token is used alone on a different machine, checks fail. |
| **Instant Logout / Terminate** | ❌ Impossible (Stale validity) | ✅ Instant (Revoked in Redis) | JWT remains valid. SWT deletes the Redis session immediately on logout. |
| **Fast Expiry Verification** | ❌ Decrypt first, then check | ✅ Validates expiration first | Protects database and server CPU from resource-exhaustion attacks. |
| **Failover Resiliency** | ⚠️ Library crash | ✅ Auto fallback | In-Memory fallback keeps service alive if Redis suffers outage. |

---

## API Reference

### `RedisStore` Class
Central session coordinator connecting token state validations to Redis.
* **`new RedisStore(redisClient, options)`**
  * `redisClient`: `any` - Standard Redis connection client (`redis` or `ioredis` instance).
  * `options`: `RedisStoreOptions` (optional)
    * `prefix`: `string` - Custom Redis key prefix (default: `"swt:session:"`).
    * `ttl`: `number` - Session lifetime limit in seconds (default: `86400` / 24 hours).

---

### `async sign(data, secretOrPrivateKey, options)`
Generates an encrypted authentication token.
* **Arguments:**
  * `data`: `Record<string, any>` - Payload object. **Must** contain `userId`.
  * `secretOrPrivateKey`: `string` - Symmetric secret or PEM Private Key.
  * `options`: `SignOptions` (optional)
    * `fingerprint`: `boolean` - Enables DPoP and registers session state (default: `false`).
    * `clientPublicKey`: `string | Record<string, any>` - The browser's public key (JWK) for DPoP.
    * `store`: `Store` - RedisStore instance. Required if `fingerprint` is enabled.
    * `expiresIn`: `number` - Access token expiration span in seconds (default: `900` / 15 minutes).
    * `generateRefreshToken`: `boolean` - Emits a rotatable refresh token alongside the access token.
    * `refreshExpiresIn`: `number` - Expiration lifespan for refresh token.
    * `encryptionSecret`: `string` - Separate AES key (mandatory if signing with asymmetric private key).
    * `auditLogger`: `AuditLogger` - Callback function to intercept and record auth events.

---

### `async verify(token, secretOrPublicKey, options)`
Authenticates, verifies, and decrypts a Secure Web Token.
* **Arguments:**
  * `token`: `string` - The raw SWT token.
  * `secretOrPublicKey`: `string` - Symmetric secret or PEM Public Key.
  * `options`: `VerifyOptions` (optional)
    * `sessionId`: `string` - Active session ID from browser cookie.
    * `store`: `Store` - The active RedisStore.
    * `dpopProof`: `string` - Self-contained DPoP proof string.
    * `encryptionSecret`: `string` - Separate GCM encryption secret.
    * `auditLogger`: `AuditLogger` - Custom logging handler.

---

### `async refresh(refreshToken, secret, options)`
Validates an active refresh token and emits a rotated access and refresh token pair.
* **Arguments:**
  * `refreshToken`: `string` - Active refresh token.
  * `secret`: `string` - Symmetric or asymmetric signing secret.
  * `options`: `RefreshOptions`
    * `store`: `Store` - RedisStore instance.
    * `sessionId`: `string` - Active session ID.
    * `dpopProof`: `string` - DPoP proof header.
    * `clientPublicKey`: `string | Record<string, any>` - The browser's public key JWK.

---

### `swtMiddleware(options)`
Express middleware validation helper.
* **Arguments:**
  * `options`: `MiddlewareOptions`
    * `secret`: `string` - Verification secret or PEM Public Key.
    * `store`: `Store` - Active session store client.
    * `cookieName`: `string` - Session cookie key name (default: `"swt_session"`).
    * `encryptionSecret`: `string` - Encryption key (asymmetric mode).
    * `auditLogger`: `AuditLogger` - Event callback.

---

## Security Audit Logging & SIEM Integration

SWT tracks critical auth lifecycle logs natively. Connect verification events directly to tracking systems or log analyzers (e.g., Datadog, ELK, AWS CloudWatch):

```typescript
import { verify } from "secure-web-token";

const auditLogger = (event) => {
  console.log(`[SWT AUDIT] Event: ${event.event} | Session: ${event.sessionId} | Reason: ${event.reason || "N/A"}`);
};

const payload = await verify(token, SECRET, {
  sessionId,
  store: sessionStore,
  auditLogger
});
```

---

## Testing & Simulations

### Running Integration Tests
Validate token rotation, cookie session matching, and Redis storage:

```bash
npm run build
npm test
```

### Running Attack Simulation
Execute the demo simulation to see how SWT successfully blocks simulated session theft, device mismatch hijack attempts, and logged-out token reuse:

```bash
npm run build
node demo_attack.js
```

---

## FAQ

**Q: Is Secure Web Token a direct replacement for JWT libraries?**  
Yes. SWT is designed to map cleanly over libraries like `jsonwebtoken`. You replace `jwt.sign()` with `sign()`, and `jwt.verify()` with `verify()` or `swtMiddleware()`. The main addition is supplying the `RedisStore` client and cookie validation setup.

**Q: Can I use asymmetric RSA or ECDSA keys?**  
Yes. You can sign tokens with your private key and distribute the public key to downstream microservices to verify token signatures, while keeping the GCM payload encryption key secret.

**Q: Is stateless auth better than stateful auth?**  
Stateless auth seems simple, but it fails to support standard security requirements like immediate logout, session revocation, or token theft protection. SWT provides the best of both worlds: a self-contained, encrypted bearer token for route authorization, backed by a low-latency Redis cache for session tracking and DPoP validation.

---

## Contributing & License

Contributions, issues, and feature requests are welcome. This project is licensed under the [MIT License](./LICENSE) © [MintuSingh07](https://github.com/MintuSingh07).
