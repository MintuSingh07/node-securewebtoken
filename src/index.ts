/**
 * Secure Web Token (SWT)
 * Encrypted, device-bound alternative to JWT
 */

export { default as sign } from "./sign";
export { default as verify } from "./verify";
export { default as refresh } from "./refresh";
export { swtMiddleware } from "./middleware";

// Export store helpers & classes
export { getStore, StoreType, Store, Session, RedisStore, RedisStoreOptions, MemoryStore } from "./store";

// Export audit logging types
export { AuditLogger, AuditLogEvent, AuditEventName } from "./audit";

// Export options and middleware types
export type { SignOptions } from "./sign";
export type { VerifyOptions } from "./verify";
export type { RefreshOptions } from "./refresh";
export type { MiddlewareOptions, SwtRequest } from "./middleware";

