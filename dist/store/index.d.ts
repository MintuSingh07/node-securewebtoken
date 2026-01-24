import { Store } from "./types";
export type StoreType = "memory";
/**
 * Retrieves a session store instance by type.
 *
 * @param type - The type of store to retrieve (e.g., 'memory').
 * @returns The store instance or null if no type is provided or the type is invalid.
 */
export declare function getStore(type?: StoreType): Store | null;
//# sourceMappingURL=index.d.ts.map