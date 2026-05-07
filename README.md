# secure-web-token (SWT)

> **The secure alternative to JWT** — encrypted, device-bound, and built for production security.

[![npm version](https://img.shields.io/npm/v/secure-web-token)](https://www.npmjs.com/package/secure-web-token)
[![npm downloads](https://img.shields.io/npm/dm/secure-web-token)](https://www.npmjs.com/package/secure-web-token)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```bash
npm install secure-web-token
```

---

## Why SWT? (The JWT Problem)

**JWT has well-known, unfixed security flaws.** If you are using JWT in a security-critical app and have not thought about these, you should stop and read this:

| Problem | JWT | SWT (Secure Web Token) |
|---|---|---|
| Payload encryption | ❌ Base64 only (readable by anyone) | ✅ AES-256-GCM encrypted |
| Device binding | ❌ Token works on any device | ✅ Bound to one device/session |
| True logout | ❌ Tokens stay valid after logout | ✅ Server-side revocation |
| Token theft impact | ❌ Stolen token = full account access | ✅ Stolen token is useless on another device |
| Sensitive data in token | ❌ Visible in browser devtools | ✅ Encrypted, never exposed |

> **If you are storing user roles, permissions, or any sensitive identifiers in a JWT — they are readable by anyone with the token.** SWT fixes this.

---

## What is Secure Web Token (SWT)?

**Secure Web Token (SWT)** is a Node.js authentication library that replaces JWT with a system that is fundamentally more secure by design:

1. **AES-256-GCM Encryption** — Your token payload is fully encrypted, not just encoded.
2. **Device Binding** — Each token is tied to the exact device it was issued to. A stolen token cannot be used from a different device.
3. **Server-Side Session Management** — Sessions live on the server. Logout actually works.
4. **HttpOnly Cookie + Token Dual Guard** — Combines the security of HttpOnly cookies with encrypted bearer tokens.

**Best suited for:** Admin dashboards, SaaS apps, course platforms, internal tools, healthcare apps, fintech, and any application where a stolen session is unacceptable.

---

## Installation

```bash
npm install secure-web-token
```

```ts
// ESM
import { sign, verify, getStore } from "secure-web-token";

// CommonJS
const { sign, verify, getStore } = require("secure-web-token");
```

---

## Quick Start

### 1. Sign a Token (Login)

```ts
import { sign } from "secure-web-token";

const SECRET = "your-256-bit-secret";

const { token, sessionId } = sign(
  { userId: 1, role: "admin" },
  SECRET,
  {
    fingerprint: true,   // bind to device
    store: "memory",     // server-side session store
    expiresIn: 3600,     // 1 hour
  }
);

// Send `token` to client, store `sessionId` in HttpOnly cookie
```

### 2. Verify a Token (Protected Route)

```ts
import { verify, getStore } from "secure-web-token";

const store = getStore("memory");
const session = store.getSession(sessionId);  // from HttpOnly cookie

const payload = verify(token, SECRET, {
  sessionId,
  fingerprint: session.fingerprint,
  store: "memory",
});

// payload.data => { userId: 1, role: "admin" }
```

---

## Full Express.js Example

```ts
import express from "express";
import cookieParser from "cookie-parser";
import { sign, verify, getStore } from "secure-web-token";

const app = express();
app.use(express.json());
app.use(cookieParser());

const SECRET = process.env.SWT_SECRET!;
const store = getStore("memory");

// Login — issue SWT
app.post("/login", (req, res) => {
  const user = { userId: 1, name: "Alice", role: "admin" };

  const { token, sessionId } = sign(user, SECRET, {
    fingerprint: true,
    store: "memory",
    expiresIn: 3600,
  });

  // sessionId goes in an HttpOnly cookie — never accessible to JS
  res.cookie("swt_session", sessionId, { httpOnly: true, secure: true });

  // Encrypted token goes to client
  res.json({ token });
});

// Protected route — verify SWT
app.get("/profile", (req, res) => {
  try {
    const sessionId = req.cookies.swt_session;
    const session = store.getSession(sessionId);
    const token = req.headers.authorization?.split(" ")[1];

    const payload = verify(token, SECRET, {
      sessionId,
      fingerprint: session.fingerprint,
      store: "memory",
    });

    res.json({ user: payload.data });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Logout — truly invalidates the session
app.post("/logout", (req, res) => {
  const sessionId = req.cookies.swt_session;
  store.deleteSession(sessionId);
  res.clearCookie("swt_session");
  res.json({ success: true });
});

app.listen(4000);
```

---

## Token Payload Structure

The payload sent to the client is **fully AES-256-GCM encrypted**. Internally it looks like:

```json
{
  "data": {
    "userId": 1,
    "role": "admin"
  },
  "iat": 1768368114,
  "exp": 1768369014,
  "fp": "device-fingerprint-id"
}
```

Unlike JWT, **this is not readable** by decoding the token in the browser or on another server.

---

## SWT vs JWT — Deep Comparison

### JWT Security Flaws (Why You Should Replace JWT)

**1. Payloads are not encrypted.**
JWT payloads are Base64URL encoded — not encrypted. Anyone who intercepts or steals the token can read the payload. If you store `role: "admin"` in a JWT, an attacker can see it.

**2. No device binding.**
A JWT issued to a user in New York can be used from a server in Russia. There is no native mechanism in JWT to prevent this.

**3. Logout does not work (by design).**
JWT is stateless. Once issued, a JWT is valid until it expires — even after the user logs out. The only fix (token blocklist) defeats the purpose of being stateless.

**4. Token theft = full session compromise.**
If a JWT is stolen via XSS or network interception, the attacker has full access for the token's entire lifetime.

### How SWT Fixes Every One of These

| JWT Flaw | SWT Solution |
|---|---|
| Readable payload | AES-256-GCM encryption — payload is unreadable without the server secret |
| No device binding | Device fingerprint stored in server session — token only valid on original device |
| Logout doesn't work | Server-side session deletion — revocation is instant and permanent |
| Token theft | Stolen token cannot be used without matching device fingerprint + server session |

---

## Frequently Asked Questions

**Q: Is SWT a drop-in replacement for JWT?**
A: The API is simple and migration is straightforward. Instead of `jwt.sign()` use `swt.sign()`. The main addition is server-side session storage and device fingerprinting.

**Q: What encryption does SWT use?**
A: AES-256-GCM — the gold standard for symmetric authenticated encryption. The same algorithm used by TLS 1.3.

**Q: Does SWT support Redis?**
A: The architecture is Redis-ready. The store interface is designed to plug in Redis for production distributed systems.

**Q: Does using server-side sessions make SWT stateful?**
A: Yes — intentionally. The "stateless = good" assumption of JWT trades security for scalability. SWT recovers security while maintaining a minimal server-side footprint. For most applications, this is the correct tradeoff.

**Q: When should I still use JWT?**
A: JWT is acceptable for low-security, public-data, short-lived tokens between internal microservices where token interception risk is low. For anything user-facing, SWT is the better choice.

**Q: What Node.js version is required?**
A: Node.js 16+ (uses native `crypto` module for AES-256-GCM).

---

## Security Architecture

```
Client                          Server
  │                               │
  │  POST /login                  │
  ├──────────────────────────────►│
  │                               │  sign(payload, secret, { fingerprint: true })
  │                               │  ┌─────────────────────────────────┐
  │                               │  │ 1. Encrypt payload (AES-256-GCM)│
  │                               │  │ 2. Generate device fingerprint   │
  │                               │  │ 3. Store session server-side     │
  │                               │  └─────────────────────────────────┘
  │  { token }  +  [HttpOnly Cookie: sessionId]
  │◄──────────────────────────────┤
  │                               │
  │  GET /profile                 │
  │  Authorization: Bearer <token>│
  │  Cookie: swt_session=<id>     │
  ├──────────────────────────────►│
  │                               │  verify(token, secret, { sessionId, fingerprint })
  │                               │  ┌─────────────────────────────────┐
  │                               │  │ 1. Decrypt token                 │
  │                               │  │ 2. Match device fingerprint      │
  │                               │  │ 3. Validate server session       │
  │                               │  └─────────────────────────────────┘
  │  { user: { ... } }            │
  │◄──────────────────────────────┤
```

---

## Roadmap

- [x] AES-256-GCM payload encryption
- [x] Device fingerprint binding
- [x] Memory session store
- [x] Token expiry (`iat`, `exp`)
- [ ] Redis session store adapter
- [ ] Token rotation / refresh
- [ ] TypeScript types (strict)
- [ ] Express.js middleware helper
- [ ] Audit log support

---

## Contributing

PRs and issues welcome. If you find a security vulnerability, please open a private security advisory rather than a public issue.

---

## License

MIT

---

> **Stop using JWT for sensitive user sessions. Your users deserve better.**  
> `npm install secure-web-token`