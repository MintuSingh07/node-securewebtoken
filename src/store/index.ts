import { memoryStore } from "./memoryStore";
import { Store } from "./types";

export type StoreType = "memory";

export function getStore(type?: StoreType): Store | null {
    if (!type) return null;

    switch (type) {
        case "memory":
            return memoryStore;
        default:
            return null;
    }
}
