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
  <a href="#redis-session-store-distributed-scaling">Redis Store Integration</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#full-expressjs--redis-example">Full Redis & Express Example</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#swt-vs-jwt--deep-comparison">SWT vs JWT</a> •
  <a href="#faq">FAQ</a>
</p>

---

## Why SWT?

**JWT has well-known, unfixed security problems.** If you're running a security-critical app — admin panel, SaaS dashboard, fintech, healthcare — and you haven't thought about these, stop and read this.

| Problem | JWT | SWT (Redis-backed) |
|---|---|---|
| Payload encryption | ❌ Base64 only — readable by anyone | ✅ AES-256-GCM encrypted |
| Device binding | ❌ Token works on any device, anywhere | ✅ Bound to original device fingerprint in Redis |
| True logout | ❌ Tokens stay valid after logout | ✅ Instant server-side revocation in Redis |
| Token theft impact | ❌ Stolen token = full account access | ✅ Stolen token fails fingerprint check, instantly revocable |
| Scalability | ✅ Stateless | ✅ Distributed session state via low-latency Redis |

> **If you're storing user roles, permissions, or any sensitive identifiers in a JWT — they're readable by anyone who gets that token.** SWT fixes this at the architecture level using AES-256-GCM encryption and distributed session states in Redis.

---

## Redis Session Store (Distributed Scaling)

The **`RedisStore`** adapter is the core engine for production scaling in Secure Web Token. It stores session bindings in Redis, enabling multiple server instances, microservices, or serverless clusters to perform secure, stateful, and device-bound validations with extremely low latency.

```
                  ┌──────────────────────────────┐
                  │      Load Balancer / Gateway │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Server Node A   │     │ Server Node B   │     │ Server Node C   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
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

#### Using `ioredis`
```ts
import { RedisStore } from "secure-web-token";
import Redis from "ioredis";

const client = new Redis("redis://localhost:6379");

const store = new RedisStore(client, {
  prefix: "auth:session:",
  ttl: 86400
});
```

### 2. Under the Hood: Redis Key Schema

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

## Installation

```bash
npm install secure-web-token
```

---

## Quick Start

### 1. Generate a Redis-Bound Token

```ts
import { sign, RedisStore } from "secure-web-token";
import { createClient } from "redis";

const redisClient = createClient();
await redisClient.connect();

const store = new RedisStore(redisClient);
const SECRET = "your-256-bit-secret";

const { token, sessionId, refreshToken } = await sign(
  { userId: "user_101", role: "admin" },
  SECRET,
  {
    fingerprint: true,           // bind to this device
    store: store,                // persist state in Redis
    expiresIn: 900,              // 15 minutes access token expiry
    generateRefreshToken: true,  // generate long-lived refresh token
    refreshExpiresIn: 604800     // 7 days refresh token expiry
  }
);

// → Send `token` and `refreshToken` to client
// → Store `sessionId` in an HttpOnly cookie
```

### 2. Verify a Token using Redis

```ts
import { verify, RedisStore } from "secure-web-token";

const store = new RedisStore(redisClient);
const session = await store.getSession(sessionId); // reads from Redis

const payload = await verify(token, SECRET, {
  sessionId,
  fingerprint: session.fingerprint, // must match original device
  store: store,                     // read verification mapping from Redis
});

// payload.data → { userId: "user_101", role: "admin" }
```

### 3. Rotate Tokens via Silent Refresh

```ts
import { refresh, RedisStore } from "secure-web-token";

const store = new RedisStore(redisClient);

const rotated = await refresh(oldRefreshToken, SECRET, {
  sessionId,
  fingerprint: requestFingerprint,
  store: store, // Validate and rotate session records inside Redis
  expiresIn: 900,
  refreshExpiresIn: 604800
});

// rotated.token → New access token
// rotated.refreshToken → New rotated refresh token
```

### 4. Logout (Instant Session Revocation)

```ts
// Deletes key from Redis — token is dead immediately across all server nodes
await store.revokeSession(sessionId);
res.clearCookie("swt_session");
```

---

## Full Express.js + Redis Example

Here is a full production-ready implementation utilizing Express, a live Redis client, cookies, token rotation, and middleware:

```ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createClient } from "redis";
import { sign, verify, RedisStore, refresh, swtMiddleware } from "secure-web-token";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const SECRET = process.env.SWT_SECRET || "a-very-secure-256-bit-key-for-production";

// Initialize Redis Client & Store
const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

const redisStore = new RedisStore(redisClient, {
  prefix: "app:session:",
  ttl: 86400
});

// ──────────────────────────────────────────
// POST /login — Register session in Redis
// ──────────────────────────────────────────
app.post("/login", async (req, res) => {
  // Perform credential authentication checks here
  const user = { userId: "user_101", name: "Alice", role: "admin" };

  const { token, sessionId, refreshToken } = await sign(user, SECRET, {
    fingerprint: true,
    store: redisStore,
    expiresIn: 900,
    generateRefreshToken: true,
    refreshExpiresIn: 604800
  });

  // sessionId → XSS-Proof HttpOnly cookie
  res.cookie("swt_session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({ token, refreshToken });
});

// ──────────────────────────────────────────
// GET /profile — Authenticate requests via Redis
// ──────────────────────────────────────────
app.get(
  "/profile",
  swtMiddleware({
    secret: SECRET,
    store: redisStore,
    requireSession: true, // performs Redis verification check
    getFingerprint: (req) => req.headers["user-agent"] || "unknown"
  }),
  (req, res) => {
    // Authenticated data is available in req.swt
    res.json({ user: req.swt });
  }
);

// ──────────────────────────────────────────
// POST /refresh — Token rotation endpoint
// ──────────────────────────────────────────
app.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const sessionId = req.cookies.swt_session;
    const fingerprint = req.headers["user-agent"] || "unknown";

    // Rotates the tokens, verifying existing states in Redis
    const rotated = await refresh(refreshToken, SECRET, {
      sessionId,
      fingerprint,
      store: redisStore,
      expiresIn: 900,
      refreshExpiresIn: 604800
    });

    res.json(rotated);
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh session" });
  }
});

// ──────────────────────────────────────────
// POST /logout — Revoke key from Redis
// ──────────────────────────────────────────
app.post("/logout", async (req, res) => {
  const sessionId = req.cookies.swt_session;
  if (sessionId) {
    await redisStore.revokeSession(sessionId); // Session deleted instantly in Redis
  }
  res.clearCookie("swt_session");
  res.json({ success: true });
});

app.listen(4000);
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

### `async sign(data, secret, options)`
Generates an encrypted token and registers a session (writes to Redis if `RedisStore` is passed).
* **Arguments:**
  * `data`: `Record<string, any>` — Payload object to encrypt. Must include `userId`.
  * `secret`: `string` — Key derivation and signature secret.
  * `options`: `SignOptions`
    * `fingerprint`: `boolean` — Enables device binding and session state.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `expiresIn`: `number` — Access token lifespan in seconds (default: `900`).
    * `generateRefreshToken`: `boolean` — Generates a refresh token.
    * `refreshExpiresIn`: `number` — Refresh token lifespan in seconds.
    * `auditLogger`: `AuditLogger` — Hooks into security events.
* **Returns:** `Promise<{ token: string; sessionId?: string; refreshToken?: string }>`

### `async verify(token, secret, options)`
Verifies token signature, decrypts payload, and validates state boundaries against Redis.
* **Arguments:**
  * `token`: `string` — The SWT string.
  * `secret`: `string` — Decryption secret.
  * `options`: `VerifyOptions`
    * `sessionId`: `string` — Session ID cookie.
    * `fingerprint`: `string` — Request device fingerprint.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `auditLogger`: `AuditLogger` — Audits success/failure events.
* **Returns:** `Promise<Record<string, any>>`

### `async refresh(refreshToken, secret, options)`
Validates refresh token claims against Redis state and emits a rotated access/refresh pair.
* **Arguments:**
  * `refreshToken`: `string` — Refresh token.
  * `secret`: `string` — Secret key.
  * `options`: `RefreshOptions`
    * `sessionId`: `string` — Session ID.
    * `fingerprint`: `string` — Device fingerprint.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
* **Returns:** `Promise<{ token: string; sessionId?: string; refreshToken?: string }>`

### `swtMiddleware(options)`
Express middleware validation helper.
* **Arguments:**
  * `options`: `MiddlewareOptions`
    * `secret`: `string` — Secret key.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore`.
    * `cookieName`: `string` — Cookie name (default: `"swt_session"`).
    * `requireSession`: `boolean` — Performs Redis check.
    * `getFingerprint`: `(req) => string` — Custom fingerprint callback.
* **Returns:** Express middleware handler.

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

---

**Q: What encryption algorithm does SWT use?**

AES-256-GCM — the gold standard for symmetric authenticated encryption, recommended by NIST, and the same cipher used in TLS 1.3. It provides both confidentiality and integrity (tamper detection) in a single pass.

---

**Q: Does SWT support Redis for distributed systems?**

Yes. The Redis store adapter is available out-of-the-box. You can instantiate `RedisStore` directly passing any standard Redis client.

---

**Q: SWT is stateful. Isn't stateless better?**

Stateless JWT trades security for scalability. That tradeoff made sense for internal microservices, but not for user-facing auth. SWT uses a minimal server-side footprint — one small session record per active user — which is manageable at any production scale. The security gains far outweigh the overhead.

---

**Q: When should I still use JWT?**

JWT is fine for short-lived, low-sensitivity tokens between internal services where interception risk is low and logout/device binding don't matter. For any user-facing session, SWT is the better choice.

---

**Q: What Node.js version is required?**

Node.js `>=25.5.0`. SWT uses the native `crypto` module for AES-256-GCM — no external cryptography dependencies.

---

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
