import { memoryStore } from "./memoryStore";
import { Store } from "./types";

export type StoreType = "memory";

/**
 * Retrieves a session store instance by type.
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
