/**
 * Secure Web Token (SWT)
 * Encrypted, device-bound alternative to JWT
 */

export { default as sign } from "./sign";
export { default as verify } from "./verify";

// Export store helpers
export { getStore, StoreType } from "./store";

// Export types
export type { SignOptions } from "./sign";
export type { VerifyOptions } from "./verify";
export type { Store } from "./store/types";
