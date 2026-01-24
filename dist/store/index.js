"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = getStore;
const memoryStore_1 = require("./memoryStore");
/**
 * Retrieves a session store instance by type.
 *
 * @param type - The type of store to retrieve (e.g., 'memory').
 * @returns The store instance or null if no type is provided or the type is invalid.
 */
function getStore(type) {
    if (!type)
        return null;
    switch (type) {
        case "memory":
            return memoryStore_1.memoryStore;
        default:
            return null;
    }
}
