# Secure Web Token (SWT)

<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778127677/varient-1-circle_wykez9.png" alt="Secure Web Token Logo" width="80" />
</p>

<p align="center">
  <strong>The secure, encrypted, device-bound, Redis-backed alternative to JWT — built for Node.js</strong>
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
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778126974/downloads-badge_vyp6px.svg" alt="Secure Web Token banner" width="700" />
</p>

---

## Why SWT?

Traditional JSON Web Tokens (JWT) suffer from critical, design-level security limitations. If you are building a security-sensitive application — such as an admin portal, SaaS dashboard, fintech platform, or healthcare application — standard JWT may expose your user data and session credentials to serious risks. 

**Secure Web Token (SWT)** is a modern, stateful, and secure token alternative to JWT designed specifically for Node.js. It integrates AES-256-GCM encryption with device fingerprint binding and low-latency Redis session state management.

| Feature / Threat | Traditional JWT | Secure Web Token (SWT) | Security Impact |
| :--- | :---: | :---: | :--- |
| **Payload Privacy** | ❌ **Base64URL Only** | ✅ **AES-256-GCM Encrypted** | JWT payloads are readable by anyone. SWT keeps user IDs, roles, and sensitive scopes fully encrypted. |
| **Device Binding** | ❌ **None (Bearer)** | ✅ **Device-Bound Fingerprint** | Stolen JWTs work anywhere. SWT tokens are locked to the specific client device fingerprint. |
| **True Instant Logout** | ❌ **Impossible** | ✅ **Real-time Session Revocation** | JWT stays valid until expiration. SWT sessions are deleted from the store immediately upon logout. |
| **Token Theft Resiliency** | ❌ **Full Compromise** | ✅ **Fingerprint Block & Alert** | A stolen SWT token fails device matching checks, blocking attackers and raising security alerts. |
| **Verification Load** | ❌ **High (Decryption First)** | ✅ **Pre-Decryption Expiry checks** | Minimizes CPU usage under DDoS attacks by validating signatures and expiry prior to AES decryption. |
| **Scale & Flexibility** | ✅ **Stateless** | ✅ **Low-Latency Distributed State** | Leverages optimized Redis caching to scale across serverless and clustered environments. |

> [!IMPORTANT]
> **If you're storing user roles, permissions, or any sensitive identifiers in a standard JWT, they are fully public.** An attacker who intercepts the token gets access to all details. SWT fixes this at the architecture level using AES-256-GCM encryption and distributed session states in Redis.

---

## Table of Contents

- [Installation](#installation)
- [Architecture & Diagrams](#architecture--diagrams)
- [Quick Start (Express & In-Memory Sessions)](#quick-start-express--in-memory-sessions)
- [Advanced Enterprise Features](#advanced-enterprise-features)
  - [Asymmetric Key Signing (RSA/ECDSA)](#asymmetric-key-signing-rsaecdsa)
  - [Cryptographic Proof-of-Possession (DPoP Binding)](#cryptographic-proof-of-possession-dpop-binding)
  - [Pre-Decryption Expiration Validation (DDoS Shield)](#pre-decryption-expiration-validation-ddos-shield)
  - [Security Audit Logging (SIEM Integration)](#security-audit-logging-siem-integration)
- [Redis Session Store & Distributed Scaling](#redis-session-store--distributed-scaling)
- [API Reference](#api-reference)
- [SWT vs JWT: A Deep Security Comparison](#swt-vs-jwt-a-deep-security-comparison)
- [Testing & Simulations](#testing--simulations)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing & License](#contributing--license)

---

## Installation

Install the library using your preferred package manager:

```bash
npm install secure-web-token
```

> [!NOTE]
> Secure Web Token requires Node.js `>=25.5.0` as it leverages modern native cryptography APIs for AES-256-GCM. No external crypto dependencies are required.

---

## Architecture & Diagrams

### Clustered / Distributed Session State
In a production cloud environment, incoming traffic is distributed across multiple nodes. SWT uses a shared, low-latency Redis cache to store active session bindings. Any node can authenticate request signatures and cross-verify the state in Redis:

<p align="center">
  <img src="https://mermaid.ink/img/Z3JhcGggVEQKICAgIGNsYXNzRGVmIGNsaWVudCBmaWxsOiNlZWYyZjMsc3Ryb2tlOiMzNzQxNTEsc3Ryb2tlLXdpZHRoOjFweCxjb2xvcjojMWYyOTM3OwogICAgY2xhc3NEZWYgbGIgZmlsbDojZTBmMmZlLHN0cm9rZTojMDI4NGM3LHN0cm9rZS13aWR0aDoycHgsY29sb3I6IzAzNjlhMSxzdHJva2UtZGFzaGFycmF5OiA1IDU7CiAgICBjbGFzc0RlZiBzZXJ2ZXIgZmlsbDojZWNmZGY1LHN0cm9rZTojMDU5NjY5LHN0cm9rZS13aWR0aDoycHgsY29sb3I6IzA0Nzg1NzsKICAgIGNsYXNzRGVmIGRhdGFiYXNlIGZpbGw6I2ZlZjJmMixzdHJva2U6I2RjMjYyNixzdHJva2Utd2lkdGg6MnB4LGNvbG9yOiNiOTFjMWM7CgogICAgQ2xpZW50W0NsaWVudCAvIEJyb3dzZXJdOjo6Y2xpZW50CiAgICBMQltMb2FkIEJhbGFuY2VyIC8gQVBJIEdhdGV3YXldOjo6bGIKICAgIAogICAgc3ViZ3JhcGggQXBwU2VydmVycyBbQXBwbGljYXRpb24gTm9kZXNdCiAgICAgICAgTm9kZUFbU2VydmVyIE5vZGUgQV06OjpzZXJ2ZXIKICAgICAgICBOb2RlQltTZXJ2ZXIgTm9kZSBCXTo6OnNlcnZlcgogICAgICAgIE5vZGVDW1NlcnZlciBOb2RlIENdOjo6c2VydmVyCiAgICBlbmQKICAgIAogICAgUmVkaXNbKFNoYXJlZCBSZWRpcyBTZXNzaW9uIFN0b3JlPGJyLz4nc3d0OnNlc3Npb246KicpXTo6OmRhdGFiYXNlCgogICAgQ2xpZW50IC0tPnxIVFRQUyBSZXF1ZXN0fCBMQgogICAgTEIgLS0-IE5vZGVBCiAgICBMQiAtLT4gTm9kZUIKICAgIExCIC0tPiBOb2RlQwogICAgCiAgICBOb2RlQSA8LS0-fFNlc3Npb24gVmVyaWZpY2F0aW9ufCBSZWRpcwogICAgTm9kZUIgPC0tPnxTZXNzaW9uIFZlcmlmaWNhdGlvbnwgUmVkaXMKICAgIE5vZGVDIDwtLT58U2Vzc2lvbiBWZXJpZmljYXRpb258IFJlZGlz" alt="Clustered Session State Architecture Diagram" width="700" />
</p>

### Complete Authentication Lifecycle (Sign, Verify, Logout)
The following sequence diagram outlines how SWT processes tokens, registers state, verifies requests, and handles revocation:

<p align="center">
  <img src="https://mermaid.ink/img/c2VxdWVuY2VEaWFncmFtCiAgICBhdXRvbnVtYmVyCiAgICBhY3RvciBDbGllbnQgYXMgQ2xpZW50IC8gQnJvd3NlcgogICAgcGFydGljaXBhbnQgU2VydmVyIGFzIEFwcGxpY2F0aW9uIFNlcnZlcgogICAgcGFydGljaXBhbnQgUmVkaXMgYXMgUmVkaXMgU2Vzc2lvbiBTdG9yZQoKICAgIHJlY3QgcmdiKDI0MCwgMjQ5LCAyNTUpCiAgICAgICAgTm90ZSBvdmVyIENsaWVudCwgUmVkaXM6IDEuIEF1dGhlbnRpY2F0aW9uICYgVG9rZW4gR2VuZXJhdGlvbiAoU2lnbiBGbG93KQogICAgZW5kCiAgICBDbGllbnQtPj5TZXJ2ZXI6IFBPU1QgL2xvZ2luIChDcmVkZW50aWFscykKICAgIGFjdGl2YXRlIFNlcnZlcgogICAgTm90ZSBvdmVyIFNlcnZlcjogMS4gQXV0aGVudGljYXRlIHVzZXIgY3JlZGVudGlhbHM8YnIvPjIuIEdlbmVyYXRlIGRldmljZUlkICYgc2Vzc2lvbklkIChVVUlEcyk8YnIvPjMuIHNpZ24ocGF5bG9hZCwgc2VjcmV0LCB7IGZpbmdlcnByaW50OiB0cnVlIH0pPGJyLz40LiBFbmNyeXB0IHBheWxvYWQgdmlhIEFFUy0yNTYtR0NNCiAgICBTZXJ2ZXItPj5SZWRpczogcmVnaXN0ZXJTZXNzaW9uKHsgc2Vzc2lvbklkLCB1c2VySWQsIGZpbmdlcnByaW50IH0pCiAgICBhY3RpdmF0ZSBSZWRpcwogICAgUmVkaXMtLT4-U2VydmVyOiBBY2tub3dsZWRnZSBzZXNzaW9uIHN0b3JlZAogICAgZGVhY3RpdmF0ZSBSZWRpcwogICAgU2VydmVyLS0-PkNsaWVudDogUmVzcG9uc2U6IHsgdG9rZW4gfSArIEh0dHBPbmx5IENvb2tpZTogc2Vzc2lvbklkCiAgICBkZWFjdGl2YXRlIFNlcnZlcgoKICAgIHJlY3QgcmdiKDI0MCwgMjUzLCAyNDQpCiAgICAgICAgTm90ZSBvdmVyIENsaWVudCwgUmVkaXM6IDIuIFJlcXVlc3QgQXV0aG9yaXphdGlvbiAoVmVyaWZ5IEZsb3cpCiAgICBlbmQKICAgIENsaWVudC0-PlNlcnZlcjogR0VUIC9wcm9maWxlIChBdXRob3JpemF0aW9uIEJlYXJlciArIFNlc3Npb24gQ29va2llKQogICAgYWN0aXZhdGUgU2VydmVyCiAgICBOb3RlIG92ZXIgU2VydmVyOiB2ZXJpZnkodG9rZW4sIHNlY3JldCwgeyBzZXNzaW9uSWQsIGZpbmdlcnByaW50IH0pPGJyLz4xLiBWYWxpZGF0ZSBITUFDLVNIQTI1NiBzaWduYXR1cmU8YnIvPjIuIENoZWNrIGV4cGlyYXRpb24gKGV4cCkgcHJlLWRlY3J5cHRpb248YnIvPjMuIERlY3J5cHQgcGF5bG9hZCAoQUVTLTI1Ni1HQ00pCiAgICBTZXJ2ZXItPj5SZWRpczogZ2V0U2Vzc2lvbihzZXNzaW9uSWQpCiAgICBhY3RpdmF0ZSBSZWRpcwogICAgUmVkaXMtLT4-U2VydmVyOiBSZXR1cm4gYWN0aXZlIHNlc3Npb24gZGF0YQogICAgZGVhY3RpdmF0ZSBSZWRpcwogICAgTm90ZSBvdmVyIFNlcnZlcjogVmFsaWRhdGUgc2Vzc2lvbiBtYXRjaGVzIHRva2VuICYgcmVxdWVzdCBmaW5nZXJwcmludAogICAgU2VydmVyLS0-PkNsaWVudDogU2VydmUgcHJvdGVjdGVkIHJlc291cmNlICgyMDAgT0sgKyBwYXlsb2FkKQogICAgZGVhY3RpdmF0ZSBTZXJ2ZXIKCiAgICByZWN0IHJnYigyNTQsIDI0MiwgMjQyKQogICAgICAgIE5vdGUgb3ZlciBDbGllbnQsIFJlZGlzOiAzLiBTZXNzaW9uIFJldm9jYXRpb24gKExvZ291dCBGbG93KQogICAgZW5kCiAgICBDbGllbnQtPj5TZXJ2ZXI6IFBPU1QgL2xvZ291dCAoU2Vzc2lvbiBDb29raWUpCiAgICBhY3RpdmF0ZSBTZXJ2ZXIKICAgIFNlcnZlci0-PlJlZGlzOiByZXZva2VTZXNzaW9uKHNlc3Npb25JZCkKICAgIGFjdGl2YXRlIFJlZGlzCiAgICBSZWRpcy0tPj5TZXJ2ZXI6IEFja25vd2xlZGdlIHNlc3Npb24gZGVsZXRlZAogICAgZGVhY3RpdmF0ZSBSZWRpcwogICAgTm90ZSBvdmVyIFNlcnZlcjogQ2xlYXIgSHR0cE9ubHkgc2Vzc2lvbiBjb29raWUKICAgIFNlcnZlci0tPj5DbGllbnQ6IFJlc3BvbnNlOiB7IG1lc3NhZ2U6ICJMb2dnZWQgb3V0ISIgfQogICAgZGVhY3RpdmF0ZSBTZXJ2ZXI=" alt="Complete Authentication Lifecycle Sequence Diagram" width="700" />
</p>

---

## Quick Start (Express & In-Memory Sessions)

If you are setting up local authentication or building a small application, you can implement a complete auth system in **under 3 minutes** using the stateful In-Memory store.

### Simple Express Server Implementation

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const { sign, verify, getStore, swtMiddleware } = require("secure-web-token");

const app = express();
app.use(express.json());
app.use(cookieParser());

const SECRET = "a-very-secure-256-bit-key-for-token-signing";
const memoryStore = getStore("memory"); // Stateful store in server memory

// 1. Login Endpoint - Generates Token and registers Session State
app.post("/login", async (req, res) => {
  const { userId, username } = req.body;
  const userAgent = req.headers["user-agent"] || "";
  
  // Sign token, encrypt payload, and create active session in Memory
  const { token, sessionId } = await sign(
    { userId, username },
    SECRET,
    {
      fingerprint: true, // Enable device binding check
      clientFingerprint: userAgent,
      store: memoryStore
    }
  );

  // Send sessionId in secure, HttpOnly cookie (protects against XSS extraction)
  res.cookie("swt_session", sessionId, { httpOnly: true, secure: false });
  // Send the encrypted, signed bearer token in the JSON body
  res.json({ token });
});

// 2. Protected Route - Access Controlled via Middleware
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
    // req.swt contains the decrypted, authenticated payload data
    res.json({ message: "Welcome!", user: req.swt });
  }
);

// 3. Logout Endpoint - Instant Server-side Revocation
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

## Advanced Enterprise Features

SWT is built with senior engineers in mind, offering production-ready features for high-traffic, microservice-based, or high-security architectures.

### Asymmetric Key Signing (RSA/ECDSA)

In microservices, you don't want to distribute a symmetric signing key to every single downstream service. SWT allows your Auth Service to sign tokens with a **Private Key (PEM)**, while downstream microservices verify signatures using the corresponding **Public Key (PEM)**.

```ts
import { sign, verify } from "secure-web-token";

// 1. Auth Service: Sign with Private Key & Encrypt payload
const { token } = await sign(
  { userId: "user_101", role: "admin" },
  PRIVATE_KEY_PEM, // RSA/ECDSA Private Key PEM
  {
    expiresIn: 900,
    encryptionSecret: "aes-payload-encryption-secret" // Secret used for AES GCM encryption
  }
);

// 2. Downstream Microservice: Verify with Public Key & Decrypt payload
const decrypted = await verify(token, PUBLIC_KEY_PEM, {
  encryptionSecret: "aes-payload-encryption-secret"
});
```

---

### Cryptographic Proof-of-Possession (DPoP Binding)

To protect against total session hijacking (where an attacker steals *both* the HttpOnly cookie and the bearer token), you can bind the session to a **non-exportable cryptographic key pair** generated directly in the user's browser using the **Web Crypto API**.

#### Step 1: Generate Keys & Sign Request on the Frontend (Browser)
```javascript
// 1. Generate a non-exportable ECDSA key pair in browser memory
const keyPair = await window.crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  false, // extractable: false (CRITICAL: Private key cannot be read by JS/XSS!)
  ["sign", "verify"]
);

// Export the Public Key as JWK to register on the backend during login
const jwkPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

// 2. Before making a request, sign a dynamic proof payload
const clientPayload = JSON.stringify({
  url: "/api/auth/profile",
  method: "GET",
  timestamp: Math.floor(Date.now() / 1000) // Anti-replay timestamp window
});

const encoder = new TextEncoder();
const signatureBuffer = await window.crypto.subtle.sign(
  { name: "ECDSA", hash: { name: "SHA-256" } },
  keyPair.privateKey,
  encoder.encode(clientPayload)
);

// Base64URL encode the signature
const clientSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
```

#### Step 2: Register & Verify on the Backend (Node)
```ts
// 1. On Login: Register the client's public JWK in the stateful session
const { token, sessionId } = await sign({ userId }, SECRET, {
  fingerprint: true,
  store: redisStore,
  clientPublicKey: JSON.stringify(jwkPublicKey) // Saved in Redis session data
});

// 2. On Request: Pass client signature headers into validation
app.get("/profile", swtMiddleware({
  secret: SECRET,
  store: redisStore,
  requireSession: true
}), (req, res) => {
  res.json(req.swt);
});
```

---

### Pre-Decryption Expiration Validation (DDoS Shield)

AES-256-GCM decryption is highly secure but CPU-intensive. In a DDoS attack scenario where attackers replay thousands of expired tokens, standard libraries decrypt the payload before checking expiry, leading to server CPU exhaustion.

SWT mitigates this by exposing the expiration (`exp`) timestamp inside the unencrypted token header. During token verification, SWT validates the expiry timestamp **before** deriving keys and running AES decryption, blocking expired tokens instantly with minimal CPU overhead.

---

### Security Audit Logging (SIEM Integration)

Track critical authentication events for security compliance and SIEM integration. SWT supports an `auditLogger` callback option in `verify()`, `sign()`, and `swtMiddleware()` to handle logging.

```ts
import { verify, AuditLogEvent } from "secure-web-token";

// Define callback to pipe events to Datadog, ELK, or AWS CloudWatch
const securityAuditLogger = (event: AuditLogEvent) => {
  console.log(`[SWT AUTH EVENT] [${new Date(event.timestamp).toISOString()}]`, {
    event: event.event,
    userId: event.userId,
    sessionId: event.sessionId,
    reason: event.reason, // Populated on verification failures
  });
};

// Pass to verify or swtMiddleware
const decrypted = await verify(token, SECRET, {
  sessionId,
  store: redisStore,
  auditLogger: securityAuditLogger
});
```

---

## Redis Session Store & Distributed Scaling

The `RedisStore` adapter is the core engine for scaling SWT session state across multiple server instances, serverless functions, or Kubernetes clusters.

### 1. Connection Setup

The `RedisStore` accepts any Redis client that implements standard `.get()`, `.set()`, and `.del()` methods (such as `redis` or `ioredis`).

#### Using `redis` (npm package)
```ts
import { RedisStore } from "secure-web-token";
import { createClient } from "redis";

const client = createClient({ url: "redis://localhost:6379" });
await client.connect();

const store = new RedisStore(client, {
  prefix: "app:session:", // Custom prefix (default: "swt:session:")
  ttl: 86400              // Session Time-To-Live in seconds (default: 24h)
});
```

### 2. Circuit-Breaker Failover (Anti-Crash Resiliency)

In production environments, databases can temporarily go offline. To prevent authentication outages, `RedisStore` features an integrated **circuit breaker**. If a Redis operation throws a connection error (such as `ECONNREFUSED`), the adapter automatically logs a console warning and **falls back to local In-Memory session tracking** until connection is restored.

---

### 3. Redis Key Schema Inspection

You can inspect active device-bound sessions in your Redis instance using the Redis CLI:

```bash
# List all active sessions
redis-cli KEYS "app:session:*"
# Output: 1) "app:session:ac916f6c-094c-4247-8a00-a5733d3da450"

# Retrieve session bindings
redis-cli GET "app:session:ac916f6c-094c-4247-8a00-a5733d3da450"
# Output: "{"sessionId":"ac916f6c-094c-4247-8a00-a5733d3da450","userId":"user_101","deviceId":"a0b0c5bc-7784-46f3-9f83-9327426df61b","fingerprint":"Mozilla/5.0 (Macintosh;...}"

# Inspect time-to-live (TTL) remaining
redis-cli TTL "app:session:ac916f6c-094c-4247-8a00-a5733d3da450"
# Output: (integer) 86324
```

---

## API Reference

### `RedisStore` Class
Class for connecting SWT session validations to a distributed Redis backend.
* **`new RedisStore(redisClient, options)`**
  * `redisClient`: `any` — Instantiated Redis client (supports node-redis or ioredis).
  * `options`: `RedisStoreOptions` (optional)
    * `prefix`: `string` — Redis key prefix (default: `"swt:session:"`).
    * `ttl`: `number` — Session persistence timeout in seconds (default: `86400` / 24 hours).
* **Methods:**
  * `async registerSession(session)`: Saves the session data to Redis under `prefix:sessionId`.
  * `async getSession(sessionId)`: Reads and parses session data from Redis.
  * `async revokeSession(sessionId)`: Deletes the session key from Redis.

---

### `async sign(data, secretOrPrivateKey, options)`
Generates an encrypted token and registers a session (writes to Redis if `RedisStore` is passed).
* **Arguments:**
  * `data`: `Record<string, any>` — Payload object to encrypt. Must include `userId`.
  * `secretOrPrivateKey`: `string` — Symmetric secret key or PEM Private Key.
  * `options`: `SignOptions`
    * `fingerprint`: `boolean` — Enables device binding and session state (default: `false`).
    * `clientFingerprint`: `string` — Custom browser/client identity string (e.g., User-Agent, IP, etc.).
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore` or `"memory"`.
    * `expiresIn`: `number` — Access token lifespan in seconds (default: `900` / 15 mins).
    * `generateRefreshToken`: `boolean` — Generates a refresh token.
    * `refreshExpiresIn`: `number` — Refresh token lifespan in seconds.
    * `clientPublicKey`: `string` — Optional browser-generated public key (JWK format) for DPoP binding.
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (mandatory when using asymmetric keys).

---

### `async verify(token, secretOrPublicKey, options)`
Verifies token signature, decrypts payload, and validates state boundaries against Redis.
* **Arguments:**
  * `token`: `string` — The SWT string.
  * `secretOrPublicKey`: `string` — Decryption secret or PEM Public Key.
  * `options`: `VerifyOptions`
    * `sessionId`: `string` — Session ID from cookies.
    * `fingerprint`: `boolean` — Enables session/device verification.
    * `clientFingerprint`: `string` — Current client fingerprint string to verify.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore` or `"memory"`.
    * `clientSignature`: `string` — Incoming browser signature (DPoP).
    * `clientPayload`: `string` — Incoming browser plaintext payload (DPoP).
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (mandatory when using asymmetric keys).
    * `auditLogger`: `AuditLogger` — Security event callback function.

---

### `async refresh(refreshToken, secret, options)`
Validates refresh token claims and emits a rotated access/refresh pair.
* **Arguments:**
  * `refreshToken`: `string` — Rotatable refresh token.
  * `secret`: `string` — Secret key.
  * `options`: `RefreshOptions`
    * `sessionId`: `string` — Session ID.
    * `fingerprint`: `boolean` — Enables session/device verification.
    * `clientFingerprint`: `string` — Current client fingerprint string to verify.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore` or `"memory"`.

---

### `swtMiddleware(options)`
Express middleware validation helper.
* **Arguments:**
  * `options`: `MiddlewareOptions`
    * `secret`: `string` — Secret key or PEM Public Key.
    * `store`: `StoreType | Store` — Pass your instanced `RedisStore` or `"memory"`.
    * `cookieName`: `string` — Cookie name (default: `"swt_session"`).
    * `requireSession`: `boolean` — Performs Redis check.
    * `fingerprint`: `boolean` — Enables fingerprint/device verification (default: `true`).
    * `getFingerprint`: `(req) => string` — Custom fingerprint callback.
    * `encryptionSecret`: `string` — Symmetric GCM encryption secret (mandatory when using asymmetric keys).
    * `auditLogger`: `AuditLogger` — Security event callback function.

---

## SWT vs JWT: A Deep Security Comparison

Traditional JWTs were designed to be stateless bearer credentials. However, that design trades security for convenience:

1. **Payload Exposure (Plaintext)**: 
   JWT uses Base64URL encoding — not encryption. Anyone with the token can decode it:
   ```js
   JSON.parse(atob(token.split('.')[1])); // Exposes roles, IDs, and emails
   ```
   *SWT solves this* by wrapping all payload data in authenticated AES-256-GCM encryption.

2. **No Device Binding**: 
   A standard JWT contains no mechanism to tie a session to a specific device. If stolen via XSS, it can be replayed from any computer. 
   *SWT solves this* by matching the request signature and cookie session ID against the unique client fingerprint saved in Redis.

3. **No True Logout**: 
   Since JWT verification is stateless, a token remains active until its cryptographic expiry time passes, even if the user clicks logout. 
   *SWT solves this* by revoking the stateful session record directly from Redis, rejecting any subsequent requests using that token.

---

## Testing & Simulations

### Run Unit and Integration Tests
To execute the complete suite of integration tests (validating token rotation, cookie session matching, and Redis storage):

```bash
npm run build
npm test
```

### Run the Security Attack Simulation
We provide a simulation script (`demo_attack.js`) that walks through typical attacker scenarios:
- A hacker attempts to reuse a token stolen via XSS.
- A hacker steals both cookies and tokens, attempting access from another device.
- A hacker attempts to reuse credentials after the user logs out.

To see the SWT security shield in action, run:

```bash
npm run build
node demo_attack.js
```

---

## FAQ

**Q: Is SWT a drop-in replacement for JWT?**  
Yes. The integration flow is very similar. Replace `jwt.sign()` with `sign()` and `jwt.verify()` with `verify()`. The main additions are registering the session ID cookie and passing the session store instance.

**Q: What encryption algorithm does SWT use?**  
It uses AES-256-GCM, the gold standard for symmetric authenticated encryption recommended by NIST and used in TLS 1.3. It ensures both payload confidentiality and tamper integrity.

**Q: SWT is stateful. Isn't stateless auth better?**  
Stateless auth is convenient but inherently insecure for user-facing sessions. It leaves you vulnerable to replay attacks and prevents you from implementing immediate logout. SWT combines the best of both: the stateless ease of a bearer token and the security of a stateful session record stored in a low-latency cache like Redis.

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
- [ ] Next.js Auth Adapter

---

## Contributing & License

PRs and issues are welcome. For security vulnerabilities, please open a private security advisory on GitHub rather than a public issue.

This project is licensed under the [MIT License](./LICENSE) © [MintuSingh07](https://github.com/MintuSingh07).

---

<p align="center">
  <strong>Stop using JWT for sensitive user sessions.</strong><br/>
  Your users deserve encrypted, device-bound, truly revocable auth.
  <br/><br/>
  <code>npm install secure-web-token</code>
</p>
