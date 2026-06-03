<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778127677/varient-1-circle_wykez9.png" alt="Secure Web Token Logo" width="48" align="center" />
  &nbsp;&nbsp;<strong>secure-web-token (SWT)</strong>
</p>

<p align="center">
  <strong>The secure, encrypted, device-bound, Redis-backed alternative to JWT — built for Node.js</strong>
</p>

<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778126974/downloads-badge_vyp6px.svg" alt="50K+ Downloads" width="560" />
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
  <a href="https://github.com/MintuSingh07/node-securewebtoken/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  </a>
  <a href="https://snyk.io/test/github/MintuSingh07/node-securewebtoken">
    <img src="https://snyk.io/test/github/MintuSingh07/node-securewebtoken/badge.svg" alt="Known Vulnerabilities" />
  </a>
</p>

<p align="center">
  <a href="#why-swt">Why SWT?</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start-noob-friendly">Quick Start</a> •
  <a href="#advanced-enterprise-features-pro-friendly">Enterprise Upgrades</a> •
  <a href="#redis-session-store-distributed-scaling">Redis Store Scaling</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#swt-vs-jwt--deep-comparison">SWT vs JWT</a> •
  <a href="#faq">FAQ</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why SWT?

**JWT has well-known, unfixed security problems.** If you're running a security-critical app — admin panel, SaaS dashboard, fintech, healthcare — and you haven't thought about these, stop and read this.

| Problem | JWT | SWT (Redis-backed) |
|---|---|---|
| **Payload encryption** | ❌ Base64 only — readable by anyone | ✅ AES-256-GCM encrypted |
| **Device binding** | ❌ Token works on any device, anywhere | ✅ Bound to original device fingerprint in Redis |
| **True logout** | ❌ Tokens stay valid after logout | ✅ Instant server-side revocation in Redis |
| **Token theft impact** | ❌ Stolen token = full account access | ✅ Stolen token fails fingerprint check, instantly revocable |
| **Scalability** | ✅ Stateless | ✅ Distributed session state via low-latency Redis |

> **If you're storing user roles, permissions, or any sensitive identifiers in a JWT — they're readable by anyone who gets that token.** SWT fixes this at the architecture level using AES-256-GCM encryption and distributed session states in Redis.

---

## Installation

```bash
npm install secure-web-token
```

---

## Quick Start (Noob-Friendly)

If you are new to backend development, this is the easiest way to add secure, stateful login to your app in **under 3 minutes** using server memory.

### Simple Express App (In-Memory Sessions)
```js
const express = require("express");
const cookieParser = require("cookie-parser");
const { sign, verify, getStore, swtMiddleware } = require("secure-web-token");

const app = express();
app.use(express.json());
app.use(cookieParser());

const SECRET = "a-very-secure-256-bit-key-for-token-signing";
const memoryStore = getStore("memory"); // Stateful store in server memory

// 1. Login Endpoint
app.post("/login", async (req, res) => {
  const { userId, username } = req.body;
  
  // Sign token and create active session in Memory
  const { token, sessionId } = await sign(
    { userId, username },
    SECRET,
    {
      fingerprint: true, // Enable device binding check
      store: memoryStore
    }
  );

  // Send sessionId in secure cookie and token in JSON
  res.cookie("swt_session", sessionId, { httpOnly: true, secure: false });
  res.json({ token });
});

// 2. Protected Route (Access Controlled via Middleware)
app.get(
  "/profile",
  swtMiddleware({
    secret: SECRET,
    store: memoryStore,
    cookieName: "swt_session",
    requireSession: true,
    fingerprint: true
  }),
  (req, res) => {
    // req.swt contains the decrypted payload
    res.json({ message: "Welcome!", user: req.swt });
  }
);

// 3. Logout Endpoint (Revoke Session instantly)
app.post("/logout", async (req, res) => {
  const sessionId = req.cookies.swt_session;
  if (sessionId) {
    await memoryStore.revokeSession(sessionId); // Erases session from memory
  }
  res.clearCookie("swt_session");
  res.json({ message: "Logged out!" });
});

app.listen(4000, () => console.log("Auth server running on port 4000"));
```

---

## Advanced Enterprise Features (Pro-Friendly)

For senior engineers building high-traffic, microservice-based, or high-security architectures, SWT provides production-hardened features.

### A. Asymmetric Key Signing (RSA/ECDSA)
In a microservices architecture, you do not want all services to share the same secret key. SWT supports signing with a **Private Key** (Auth Service only) and verification using a **Public Key** (microservices can verify without knowing the sign key).

```ts
import { sign, verify } from "secure-web-token";

// 1. Auth Service: Sign with Private Key
const { token } = await sign(
  { userId: "user_101", role: "admin" },
  PRIVATE_KEY_PEM, // PEM Private Key
  {
    expiresIn: 900,
    encryptionSecret: "aes-payload-encryption-secret" // Used for AES payload encryption
  }
);

// 2. Downstream Microservice: Verify with Public Key
const decrypted = await verify(token, PUBLIC_KEY_PEM, {
  encryptionSecret: "aes-payload-encryption-secret"
});
```

---

### B. Cryptographic Proof-of-Possession (DPoP Binding)
To completely prevent token copying (e.g. copying cookies/tokens to an incognito window or another laptop), you can bind the session to an **isolated browser key pair** using the **Web Crypto API**:

#### Step 1: Generate & Sign on the Frontend (Browser)
```javascript
// 1. Generate non-exportable Web Crypto key pair in browser
const keyPair = await window.crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  false, // extractable: false (CRITICAL: Hacker cannot copy this private key!)
  ["sign", "verify"]
);

// Save Public Key to send during login
const jwkPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

// 2. Sign a dynamic payload before making a request
const clientPayload = JSON.stringify({
  url: "/api/auth/profile",
  method: "GET",
  timestamp: Math.floor(Date.now() / 1000)
});
const encoder = new TextEncoder();
const signatureBuffer = await window.crypto.subtle.sign(
  { name: "ECDSA", hash: { name: "SHA-256" } },
  keyPair.privateKey,
  encoder.encode(clientPayload)
);
const clientSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); // Base64URL
```

#### Step 2: Register on Login & Verify on the Backend (Node)
```ts
// 1. On Login: Register the client public JWK key
const { token, sessionId } = await sign({ userId }, SECRET, {
  fingerprint: true,
  store: redisStore,
  clientPublicKey: JSON.stringify(jwkPublicKey) // Saved in Redis session
});

// 2. On Request: Middleware verifies the signature header
// Header: x-client-signature (base64url)
// Header: x-client-payload (plaintext payload)
app.get("/profile", swtMiddleware({
  secret: SECRET,
  store: redisStore,
  requireSession: true
}), (req, res) => {
  res.json(req.swt);
});
```

---

### C. Pre-Decryption Expiration Validation (DDoS Shield)
Standard JWT decryption is CPU-intensive. Under a DDoS attack, decrypting thousands of expired tokens can freeze your server. 

SWT automatically exposes the expiration timestamp (`exp`) in the unencrypted token header. During verification, it checks `exp` **before** performing AES-256 decryption, blocking expired tokens instantly with minimal CPU overhead.

---

## Redis Session Store (Distributed Scaling)

The **`RedisStore`** adapter is the core engine for production scaling in Secure Web Token. It stores session bindings in Redis, enabling multiple server instances, microservices, or serverless clusters to perform secure, stateful, and device-bound validations with extremely low latency.

```
                  ┌──────────────────────────────┐
                  │      Load Balancer / Gateway │
                  └───────────────┬──────────────┘
                                  │
         ┌────────────────────────┼───────────────────────┐
         ▼                        ▼                       ▼
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ Server Node A   │      │ Server Node B   │     │ Server Node C   │
└────────┬────────┘      └────────┬────────┘     └────────┬────────┘
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │  Shared Redis Database  │
                     │   (Key-value store)     │
                     │  [swt:session:cookieId] │
                     └─────────────────────────┘
```

### 1. Connection Types & Setup

SWT's `RedisStore` accepts any Redis client that implements standard `.get()`, `.set()`, and `.del()` methods (such as `redis` or `ioredis`).

#### Using `redis` (npm package v4)
```ts
import { RedisStore } from "secure-web-token";
import { createClient } from "redis";

const client = createClient({ url: "redis://localhost:6379" });
await client.connect();

const store = new RedisStore(client, {
  prefix: "auth:session:", // Custom prefix (default: "swt:session:")
  ttl: 86400               // Key TTL in seconds (default: 24h)
});
```

### 2. Circuit-Breaker Failover (Anti-Crash Resiliency)
In real production environments, databases go down. If Redis disconnects, you don't want your authentication service to crash. 

The `RedisStore` includes a built-in **circuit breaker**: if it encounters a connection error, it prints a console warning and **automatically falls back to In-Memory session tracking** until Redis recovers, keeping your app online.

### 3. Under the Hood: Redis Key Schema

When a user logs in and a device-bound session is registered, SWT writes a JSON stringified session to Redis under the calculated session ID:

```bash
# Verify session key in Redis CLI
127.0.0.1:6379> KEYS auth:session:*
1) "auth:session:ac916f6c-094c-4247-8a00-a5733d3da450"

# Inspect active session data
127.0.0.1:6379> GET auth:session:ac916f6c-094c-4247-8a00-a5733d3da450
"{\"sessionId\":\"ac916f6c-094c-4247-8a00-a5733d3da450\",\"userId\":\"user_101\",\"deviceId\":\"a0b0c5bc-7784-46f3-9f83-9327426df61b\",\"fingerprint\":\"a0b0c5bc-7784-46f3-9f83-9327426df61b\"}"

# Inspect Time-To-Live remaining
127.0.0.1:6379> TTL auth:session:ac916f6c-094c-4247-8a00-a5733d3da450
(integer) 86324
```

---

## API Reference

### `RedisStore` Class
Central class for connecting SWT session validations to a distributed Redis backend.
* **Constructor:** `new RedisStore(redisClient, options)`
  * `redisClient`: `any` — Instantiated Redis client (supports node-redis or ioredis).
  * `options`: `RedisStoreOptions` (optional)
    * `prefix`: `string` — Customized key prefix inside Redis (default: `"swt:session:"`).
    * `ttl`: `number` — Session persistence timeout in seconds (default: `86400` / 24 hours).
* **Methods:**
  * `async registerSession(session)`: Saves the session data to Redis under `prefix:sessionId`.
  * `async getSession(sessionId)`: Reads and parses session data from Redis.
  * `async revokeSession(sessionId)`: Deletes the session key from Redis.

### `async sign(data, secretOrPrivateKey, options)`
Generates an encrypted token and registers a session (writes to Redis if `RedisStore` is passed).
* **Arguments:**
  * `data`: `Record<string, any>` — Payload object to encrypt. Must include `userId`.
  * `secretOrPrivateKey`: `string` — Symmetric secret or PEM Private Key.
  * `options`: `SignOptions`
    * `fingerprint`: `boolean` — Enables device binding and session state (default: `false`).
    * `clientFingerprint`: `string` — Custom browser/client identity string (User-Agent, IP, etc.).
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `expiresIn`: `number` — Access token lifespan in seconds (default: `900`).
    * `generateRefreshToken`: `boolean` — Generates a refresh token.
    * `refreshExpiresIn`: `number` — Refresh token lifespan in seconds.
    * `clientPublicKey`: `string` — Optional browser-generated public key (JWK format) for DPoP binding.
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (when using asymmetric keys).

### `async verify(token, secretOrPublicKey, options)`
Verifies token signature, decrypts payload, and validates state boundaries against Redis.
* **Arguments:**
  * `token`: `string` — The SWT string.
  * `secretOrPublicKey`: `string` — Decryption secret or PEM Public Key.
  * `options`: `VerifyOptions`
    * `sessionId`: `string` — Session ID cookie.
    * `fingerprint`: `boolean` — Enables session/device verification.
    * `clientFingerprint`: `string` — Current browser/client identity string to verify.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `clientSignature`: `string` — Incoming browser signature (DPoP).
    * `clientPayload`: `string` — Incoming browser plaintext payload (DPoP).
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (when using asymmetric keys).

### `async refresh(refreshToken, secret, options)`
Validates refresh token claims against Redis state and emits a rotated access/refresh pair.
* **Arguments:**
  * `refreshToken`: `string` — Refresh token.
  * `secret`: `string` — Secret key.
  * `options`: `RefreshOptions`
    * `sessionId`: `string` — Session ID.
    * `fingerprint`: `boolean` — Enables session/device verification.
    * `clientFingerprint`: `string` — Current browser/client identity string.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.

### `swtMiddleware(options)`
Express middleware validation helper.
* **Arguments:**
  * `options`: `MiddlewareOptions`
    * `secret`: `string` — Secret key or PEM Public Key.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `cookieName`: `string` — Cookie name (default: `"swt_session"`).
    * `requireSession`: `boolean` — Performs Redis check.
    * `fingerprint`: `boolean` — Enables fingerprint/device verification (default: `true`).
    * `getFingerprint`: `(req) => string` — Custom fingerprint callback.
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (when using asymmetric keys).

---

## SWT vs JWT — Deep Comparison

### The 4 Security Problems with JWT

**1. Payloads are not encrypted**

JWT uses Base64URL encoding — not encryption. Anyone with the token can decode the payload instantly:

```js
// This works on ANY JWT right now — no key required
JSON.parse(atob(token.split('.')[1]));
// → { userId: 1, role: "admin", email: "alice@example.com" }
```

If your JWT payload leaks (XSS, logs, network interception), all your user data is exposed in plaintext.

**2. No device binding**

A JWT issued in one country works equally from any other device or server. There is no native way to say "this token belongs to this device." A stolen token is a valid credential — period.

**3. Logout is not real**

JWT is stateless by design. Once issued, a token remains cryptographically valid until it expires — regardless of what you do on the server. Client-side logout (clearing cookies/localStorage) doesn't invalidate the token. An attacker who stole it before logout still has access.

**4. Token theft = full session compromise**

There is no fallback. A stolen JWT gives the attacker the same access as the legitimate user for the token's entire lifetime, with no way to tell them apart.

### How SWT + Redis Fixes All Four

| JWT Flaw | SWT + Redis Solution |
|---|---|
| Readable payload | AES-256-GCM — unreadable without the server secret |
| No device binding | Device fingerprint checked against active Redis session |
| Logout doesn't work | `store.revokeSession()` — deletes key from Redis instantly |
| Token theft | Stolen token fails fingerprint check, revocable by admin in Redis |

---

## Security Architecture

```
Client                              Server                           Redis
  │                                   │                                │
  │  POST /login                      │                                │
  ├──────────────────────────────────►│                                │
  │                                   │  sign(payload, secret, options)│
  │                                   │  - Encrypts GCM payload        │
  │                                   │  - Maps sessionId to fingerprint
  │                                   │  - Writes to Redis             │
  │                                   ├───────────────────────────────►│
  │                                   │                                │
  │  { token }  +  Cookie: sessionId  │                                │
  │◄──────────────────────────────────┤                                │
  │                                   │                                │
  │  GET /profile                     │                                │
  │  Authorization: Bearer <token>    │                                │
  │  Cookie: swt_session=<id>         │                                │
  ├──────────────────────────────────►│                                │
  │                                   │  verify(token, secret, options)│
  │                                   │  - Checks signature & expiry   │
  │                                   │  - Reads Session from Redis    │
  │                                   ├───────────────────────────────►│
  │                                   │◄───────────────────────────────┤
  │                                   │  - Matches fingerprint         │
  │  { user: { ... } }                │                                │
  │◄──────────────────────────────────┤                                │
  │                                   │                                │
  │  POST /logout                     │                                │
  ├──────────────────────────────────►│                                │
  │                                   │  store.revokeSession(sessionId)│
  │                                   │  - Deletes key from Redis      │
  │                                   ├───────────────────────────────►│
  │  { success: true }                │                                │
  │◄──────────────────────────────────┤                                │
```

---

## FAQ

**Q: Is SWT a drop-in replacement for JWT?**

Migration is straightforward. Replace `jwt.sign()` with `sign()` from SWT and `jwt.verify()` with `verify()`. The main additions are server-side session storage and device fingerprinting — both handled automatically when you pass your instanced `RedisStore`.

**Q: What encryption algorithm does SWT use?**

AES-256-GCM — the gold standard for symmetric authenticated encryption, recommended by NIST, and the same cipher used in TLS 1.3. It provides both confidentiality and integrity (tamper detection) in a single pass.

**Q: Does SWT support Redis for distributed systems?**

Yes. The Redis store adapter is available out-of-the-box. You can instantiate `RedisStore` directly passing any standard Redis client.

**Q: SWT is stateful. Isn't stateless better?**

Stateless JWT trades security for scalability. That tradeoff made sense for internal microservices, but not for user-facing auth. SWT uses a minimal server-side footprint — one small session record per active user — which is manageable at any production scale. The security gains far outweigh the overhead.

**Q: When should I still use JWT?**

JWT is fine for short-lived, low-sensitivity tokens between internal services where interception risk is low and logout/device binding don't matter. For any user-facing session, SWT is the better choice.

**Q: What Node.js version is required?**

Node.js `>=25.5.0`. SWT uses the native `crypto` module for AES-256-GCM — no external cryptography dependencies.

**Q: Does SWT prevent XSS attacks entirely?**

SWT significantly reduces the impact of XSS. Because the session ID lives in an HttpOnly cookie, XSS cannot steal it via `document.cookie`. An attacker who steals only the bearer token still can't authenticate without the cookie — and even if they somehow get both, the device fingerprint check provides a third layer of validation.

---

## Roadmap

- [x] AES-256-GCM payload encryption
- [x] Device fingerprint binding
- [x] In-memory session store
- [x] Token expiry (`iat`, `exp`)
- [x] Redis session store adapter
- [x] Token rotation / silent refresh
- [x] Strict TypeScript types
- [x] Express.js middleware helper (`swtMiddleware()`)
- [x] Audit log support
- [x] Asymmetric signing (RSA/ECDSA) support
- [x] Cryptographic browser binding (DPoP)
- [x] Redis Circuit Breaker Failover
- [ ] React hooks (`useSWT`)

---

## Contributing

PRs and issues are welcome. For security vulnerabilities, please open a **private security advisory** on GitHub rather than a public issue.

```bash
git clone https://github.com/MintuSingh07/node-securewebtoken.git
cd node-securewebtoken
npm install
npm run build
```

---

## License

[MIT](./LICENSE) © [MintuSingh07](https://github.com/MintuSingh07)

---

<p align="center">
  <strong>Stop using JWT for sensitive user sessions.</strong><br/>
  Your users deserve encrypted, device-bound, truly revocable auth.
  <br/><br/>
  <code>npm install secure-web-token</code>
</p>
