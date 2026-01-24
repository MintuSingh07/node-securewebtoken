# 🔐 Secure Web Token (SWT)

A **secure, device-bound authentication token system** for Node.js applications.

---

## 1. About the Package

**Secure Web Token (SWT)** is a next-generation alternative to JWT, built for **security-critical applications** where token leakage, device hijacking, or session reuse must be prevented.

Unlike JWTs (which are only Base64 encoded), SWT uses **full encryption + server-side session binding**, making stolen tokens useless on other devices.

### Key Highlights ✨

- 🔐 **AES-256-GCM encrypted payloads**
- 🧷 **Device-bound tokens (single-device login)**
- 🗄 **Server-side session management**
- 🍪 **HttpOnly session cookies**
- ⏱ **Expiry support (`iat`, `exp`)**
- ⚡ Simple API: `sign()` and `verify()`
- 🧠 Memory store (Redis-ready design)

---

## 2. What Problem Does It Solve?

### Problems with JWT ❌

- Payloads are readable (Base64 ≠ encryption)
- Tokens can be reused on any device
- No native device binding
- Logout does not truly invalidate tokens

### How SWT Solves This ✅

- Encrypts payload using **AES-256-GCM**
- Binds tokens to **server-managed device sessions**
- Prevents token reuse across devices
- Supports true logout via session revocation
- Sensitive identifiers never reach the browser

**Best suited for:**
- Admin panels
- SaaS dashboards
- Course platforms
- Internal tools
- High-security APIs

---

## 3. Available Functions

### `sign()`

Creates a **secure, encrypted token** and optionally registers a **server-side device session**.

### `verify()`

Validates and decrypts the token, ensuring the request comes from the **correct device and active session**.

---

## 4. Boiler Code (Core Usage)

### `sign()` function
```ts
import { sign } from "secure-web-token";

const SECRET = "super-secret-key";

const { token, sessionId } = sign(
  { userId: 1, role: "admin" },
  SECRET,
  {
    fingerprint: true,
    store: "memory",
    expiresIn: 3600,
  }
);
```

---

### `verify()` function
```ts
import { verify, getStore } from "secure-web-token";

const store = getStore("memory");
const session = store.getSession(sessionId);

const payload = verify(token, SECRET, {
  sessionId,
  fingerprint: session.fingerprint,
  store: "memory",
});
```

---

## 5. Demo App

### Backend (Express.js + Node.js)
```ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { sign, verify, getStore } from "secure-web-token";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const SECRET = "super-secret-key";
const store = getStore("memory");

app.post("/login", (req, res) => {
  const user = { userId: 1, name: "Mintu" };

  const { token, sessionId } = sign(user, SECRET, {
    fingerprint: true,
    store: "memory",
  });

  res.cookie("swt_session", sessionId, { httpOnly: true });
  res.json({ token });
});

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

app.listen(4000);
```

### Frontend (React.js)
```tsx
import { useState } from "react";

function App() {
  const [user, setUser] = useState(null);

  const login = async () => {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    localStorage.setItem("token", data.token);
  };

  const profile = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/profile", {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(await res.json());
  };

  return (
    <>
      <button onClick={login}>Login</button>
      <button onClick={profile}>View Profile</button>
    </>
  );
}

export default App;
```

---

## 6. Payload Structure
```json
{
  "data": {
    "userId": 1,
    "role": "admin"
  },
  "iat": 1768368114,
  "exp": 1768369014,
  "fp": "device-id"
}
```

---

## 7. Installation
```bash
npm install secure-web-token
```

---

## 8. Importing
```ts
// ESM
import { sign, verify, getStore } from "secure-web-token";

// CommonJS
const { sign, verify, getStore } = require("secure-web-token");
```

---

### Final Note

If you need **encrypted tokens**, **single-device login**, and **true logout**,  
**Secure Web Token (SWT)** is built for you.
