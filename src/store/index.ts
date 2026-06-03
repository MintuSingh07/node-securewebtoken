import { memoryStore } from "./memoryStore";
import { Store } from "./types";

export type StoreType = "memory" | "redis";

// Re-export store modules
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
export function getStore(type?: StoreType): Store | null {
    if (!type) return null;

    switch (type) {
        case "memory":
            return memoryStore;
        default:
            return null;
    }
}

