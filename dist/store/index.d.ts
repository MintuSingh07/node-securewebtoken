import { Store } from "./types";
export type StoreType = "memory" | "redis";
export * from "./types";
export * from "./memoryStore";
export * from "./redisStore";
/**
 * Retrieves a session store instance by type.
 *
 * Note: To retrieve the "redis" store, you must instantiate it directly
 * with a client instance: new RedisStore(redisClient).
 *
 * @param type - The type of store to retrieve (e.g., 'memory').
 * @returns The store instance or null if no type is provided or the type is invalid.
 */
export declare function getStore(type?: StoreType): Store | null;
//# sourceMappingURL=index.d.ts.map