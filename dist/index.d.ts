/**
 * Secure Web Token (SWT) v3.0
 * Encrypted, DPoP-bound alternative to JWT
 */
export { default as sign } from "./sign";
export { default as verify } from "./verify";
export { default as refresh } from "./refresh";
export { swtMiddleware } from "./middleware";
export { Store, Session, RedisStore, RedisStoreOptions } from "./store";
export { computeJwkThumbprint } from "./dpop";
export { AuditLogger, AuditLogEvent, AuditEventName } from "./audit";
export type { SignOptions } from "./sign";
export type { VerifyOptions } from "./verify";
export type { RefreshOptions } from "./refresh";
export type { MiddlewareOptions, SwtRequest } from "./middleware";
//# sourceMappingURL=index.d.ts.map