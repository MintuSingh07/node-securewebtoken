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
 * Pluggable Resilient Redis store adapter with In-Memory failover.
 * Works with ioredis, redis (npm library), or any client that supports standard get/set/del.
 */
export declare class RedisStore implements Store {
    private client;
    private options;
    private fallbackStore;
    constructor(client: any, options?: RedisStoreOptions);
    private getKey;
    registerSession(session: Session): Promise<void>;
    getSession(sessionId: string): Promise<Session | null>;
    revokeSession(sessionId: string): Promise<void>;
}
//# sourceMappingURL=redisStore.d.ts.map