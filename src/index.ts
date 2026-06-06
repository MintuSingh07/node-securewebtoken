/**
 * Secure Web Token (SWT) v3.0
 * Encrypted, DPoP-bound alternative to JWT
 */

export { default as sign } from "./sign";
export { default as verify } from "./verify";
export { default as refresh } from "./refresh";
export { swtMiddleware } from "./middleware";

// Export store (Redis only in v3)
export { Store, Session, RedisStore, RedisStoreOptions } from "./store";

// Export DPoP utilities
export { computeJwkThumbprint } from "./dpop";

// Export audit logging types
export { AuditLogger, AuditLogEvent, AuditEventName } from "./audit";

// Export options and middleware types
export type { SignOptions } from "./sign";
export type { VerifyOptions } from "./verify";
export type { RefreshOptions } from "./refresh";
export type { MiddlewareOptions, SwtRequest } from "./middleware";
