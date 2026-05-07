<p align="center">
  <img src="https://res.cloudinary.com/dch9wfmjd/image/upload/v1778127677/varient-1-circle_wykez9.png" alt="Secure Web Token Logo" width="150" />
  <h1 align="center">secure-web-token (SWT)</h1>
</p>

<p align="center">
  <strong>The secure, encrypted, device-bound alternative to JWT — built for Node.js</strong>
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
  <a href="#quick-start">Quick Start</a> •
  <a href="#full-expressjs-example">Full Example</a> •
  <a href="#swt-vs-jwt--deep-comparison">SWT vs JWT</a> •
  <a href="#faq">FAQ</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why SWT?

**JWT has well-known, unfixed security problems.** If you're running a security-critical app — admin panel, SaaS dashboard, fintech, healthcare — and you haven't thought about these, stop and read this.

| Problem | JWT | SWT |
|---|---|---|
| Payload encryption | ❌ Base64 only — readable by anyone | ✅ AES-256-GCM encrypted |
| Device binding | ❌ Token works on any device, anywhere | ✅ Bound to the original device/session |
| True logout | ❌ Tokens stay valid after logout | ✅ Instant server-side revocation |
| Token theft impact | ❌ Stolen token = full account access | ✅ Stolen token is useless on another device |
| Sensitive data in token | ❌ Visible in browser devtools | ✅ Encrypted, never exposed |

> **If you're storing user roles, permissions, or any sensitive identifiers in a JWT — they're readable by anyone who gets that token.** SWT fixes this at the architecture level.

---

## What is Secure Web Token?

**Secure Web Token (SWT)** is a Node.js authentication library that replaces JWT with a system that is fundamentally more secure by design. It solves all four of JWT's critical weaknesses in one package.

**How it works:**

- 🔐 **AES-256-GCM Encryption** — Your token payload is fully encrypted, not just Base64 encoded. No one can read it without the server secret.
- 📱 **Device Binding** — Each token is tied to the exact device it was issued to via a server-stored fingerprint. A stolen token cannot be replayed from a different device.
- 🗄️ **Server-Side Session Management** — Sessions live on the server. Logout actually works — revocation is instant and permanent.
- 🍪 **HttpOnly Cookie + Token Dual Guard** — The session ID lives in an HttpOnly cookie (XSS-proof), the encrypted payload travels via Authorization header. Neither alone is enough.

**Best suited for:** Admin panels, SaaS dashboards, course platforms, internal tools, healthcare apps, fintech APIs, and any application where a stolen session is unacceptable.

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
    fingerprint: true,   // bind to this device
    store: "memory",     // server-side session store
    expiresIn: 3600,     // expires in 1 hour
  }
);

// → Send `token` to client
// → Store `sessionId` in an HttpOnly cookie (never send to client directly)
```

### 2. Verify a Token (Protected Route)

```ts
import { verify, getStore } from "secure-web-token";

const store = getStore("memory");
const session = store.getSession(sessionId); // retrieved from HttpOnly cookie

const payload = verify(token, SECRET, {
  sessionId,
  fingerprint: session.fingerprint, // must match original device
  store: "memory",
});

// payload.data → { userId: 1, role: "admin" }
```

### 3. Logout (True Revocation)

```ts
// Session is deleted server-side — token is immediately dead
store.deleteSession(sessionId);
res.clearCookie("swt_session");
```

---

## Full Express.js Example

```ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { sign, verify, getStore } from "secure-web-token";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const SECRET = process.env.SWT_SECRET!;
const store = getStore("memory");

// ──────────────────────────────────────────
// POST /login — Issue a secure session
// ──────────────────────────────────────────
app.post("/login", (req, res) => {
  // Authenticate user here (DB lookup, password check, etc.)
  const user = { userId: 1, name: "Alice", role: "admin" };

  const { token, sessionId } = sign(user, SECRET, {
    fingerprint: true,
    store: "memory",
    expiresIn: 3600,
  });

  // sessionId → HttpOnly cookie (invisible to JavaScript, XSS-proof)
  res.cookie("swt_session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  // Encrypted token → client (localStorage or memory)
  res.json({ token });
});

// ──────────────────────────────────────────
// GET /profile — Protected route
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// POST /logout — True session revocation
// ──────────────────────────────────────────
app.post("/logout", (req, res) => {
  const sessionId = req.cookies.swt_session;
  store.deleteSession(sessionId); // token is dead immediately
  res.clearCookie("swt_session");
  res.json({ success: true });
});

app.listen(4000);
```

### Frontend (React)

```tsx
import { useState } from "react";

function App() {
  const [user, setUser] = useState(null);

  const login = async () => {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      credentials: "include", // sends/receives the HttpOnly cookie
    });
    const { token } = await res.json();
    localStorage.setItem("swt_token", token);
  };

  const getProfile = async () => {
    const token = localStorage.getItem("swt_token");
    const res = await fetch("http://localhost:4000/profile", {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch("http://localhost:4000/logout", {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("swt_token");
    setUser(null);
  };

  return (
    <>
      <button onClick={login}>Login</button>
      <button onClick={getProfile}>View Profile</button>
      <button onClick={logout}>Logout</button>
      {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
    </>
  );
}

export default App;
```

---

## Token Payload Structure

The payload delivered to the client is **fully AES-256-GCM encrypted**. What lives inside (server-side only):

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

Unlike JWT, this structure **cannot be decoded in the browser**. There is no `atob()` trick. Without the server secret, it is ciphertext.

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

### How SWT Fixes All Four

| JWT Flaw | SWT Solution |
|---|---|
| Readable payload | AES-256-GCM — unreadable without the server secret |
| No device binding | Device fingerprint stored in server session — wrong device = rejected |
| Logout doesn't work | `store.deleteSession()` — immediate, permanent revocation |
| Token theft | Stolen token fails fingerprint check on any other device |

### Attack Surface Comparison

```
JWT Attack Model:
  Attacker steals token via XSS
  → Token is valid anywhere
  → Full account access until expiry
  → Nothing you can do

SWT Attack Model:
  Attacker steals token via XSS
  → Token requires matching HttpOnly cookie (not stealable via XSS)
  → Even with both, device fingerprint must match
  → Session can be revoked server-side instantly
```

---

## Security Architecture

```
Client                              Server
  │                                   │
  │  POST /login                      │
  ├──────────────────────────────────►│
  │                                   │  sign(payload, secret, { fingerprint: true })
  │                                   │  ┌───────────────────────────────────┐
  │                                   │  │ 1. Encrypt payload (AES-256-GCM)  │
  │                                   │  │ 2. Generate device fingerprint    │
  │                                   │  │ 3. Store session server-side      │
  │                                   │  └───────────────────────────────────┘
  │  { token }  +  Cookie: sessionId  │
  │◄──────────────────────────────────┤
  │                                   │
  │  GET /profile                     │
  │  Authorization: Bearer <token>    │
  │  Cookie: swt_session=<id>         │
  ├──────────────────────────────────►│
  │                                   │  verify(token, secret, { sessionId, fingerprint })
  │                                   │  ┌───────────────────────────────────┐
  │                                   │  │ 1. Decrypt token                  │
  │                                   │  │ 2. Match device fingerprint       │
  │                                   │  │ 3. Validate active server session │
  │                                   │  └───────────────────────────────────┘
  │  { user: { ... } }                │
  │◄──────────────────────────────────┤
  │                                   │
  │  POST /logout                     │
  ├──────────────────────────────────►│
  │                                   │  store.deleteSession(sessionId)
  │                                   │  → Token is dead. Immediately.
  │  { success: true }                │
  │◄──────────────────────────────────┤
```

---

## FAQ

**Q: Is SWT a drop-in replacement for JWT?**

Migration is straightforward. Replace `jwt.sign()` with `sign()` from SWT and `jwt.verify()` with `verify()`. The main additions are server-side session storage and device fingerprinting — both handled automatically when you pass `fingerprint: true`.

---

**Q: What encryption algorithm does SWT use?**

AES-256-GCM — the gold standard for symmetric authenticated encryption, recommended by NIST, and the same cipher used in TLS 1.3. It provides both confidentiality and integrity (tamper detection) in a single pass.

---

**Q: Does SWT support Redis for distributed systems?**

The architecture is Redis-ready by design. The session store interface is built to accept pluggable adapters — Redis support is on the roadmap and can be integrated without changing your application code.

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
- [ ] Redis session store adapter
- [ ] Token rotation / silent refresh
- [ ] Strict TypeScript types
- [ ] Express.js middleware helper (`swtMiddleware()`)
- [ ] Audit log support
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
