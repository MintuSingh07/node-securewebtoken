"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = getStore;
const memoryStore_1 = require("./memoryStore");
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
