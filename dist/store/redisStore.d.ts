import { Store, Session } from "./types";
export interface RedisStoreOptions {
    /**
     * Session expiration time in seconds. Defaults to 86400 (24 hours).
     */
    ttl?: number;
    /**
     * Prefix for all keys stored in Redis. Defaults to "swt:session:".
     */
    prefix?: string;
}
/**
 * Redis-backed session store for SWT.
 * Provides true logout and admin session revocation capabilities.
 * Works with ioredis, redis (npm), or any client supporting standard get/set/del.
 *
 * Errors propagate directly — if Redis is unreachable, operations fail
 * with clear error messages rather than silently degrading.
 */
export declare class RedisStore implements Store {
    private client;
    private options;
    constructor(client: any, options?: RedisStoreOptions);
    private getKey;
    registerSession(session: Session): Promise<void>;
    getSession(sessionId: string): Promise<Session | null>;
    revokeSession(sessionId: string): Promise<void>;
}
//# sourceMappingURL=redisStore.d.ts.map