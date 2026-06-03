"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStore = void 0;
const memoryStore_1 = require("./memoryStore");
/**
 * Pluggable Resilient Redis store adapter with In-Memory failover.
 * Works with ioredis, redis (npm library), or any client that supports standard get/set/del.
 */
class RedisStore {
    constructor(client, options = {}) {
        if (!client) {
            throw new Error("Redis client instance is required");
        }
        this.client = client;
        this.options = options;
        this.fallbackStore = new memoryStore_1.MemoryStore();
    }
    getKey(sessionId) {
        const prefix = this.options.prefix ?? "swt:session:";
        return `${prefix}${sessionId}`;
    }
    async registerSession(session) {
        const key = this.getKey(session.sessionId);
        const ttl = this.options.ttl ?? 86400; // default 24h
        const dataStr = JSON.stringify(session);
        try {
            if (typeof this.client.set === "function") {
                try {
                    const res = this.client.set(key, dataStr, { EX: ttl });
                    if (res instanceof Promise)
                        await res;
                }
                catch (err) {
                    // Fallback to position arguments (ioredis style)
                    const res = this.client.set(key, dataStr, "EX", ttl);
                    if (res instanceof Promise)
                        await res;
                }
            }
            else {
                throw new Error("Redis client does not support .set() method");
            }
        }
        catch (redisErr) {
            console.warn(`[secure-web-token] REDIS ERROR: Failed to register session in Redis. ` +
                `Falling back to In-Memory store. Error: ${redisErr.message}`);
            this.fallbackStore.registerSession(session);
        }
    }
    async getSession(sessionId) {
        const key = this.getKey(sessionId);
        try {
            if (typeof this.client.get !== "function") {
                throw new Error("Redis client does not support .get() method");
            }
            const data = this.client.get(key);
            const resolvedData = data instanceof Promise ? await data : data;
            if (!resolvedData) {
                // Fallback check (in case session was saved in fallback store due to pre-existing redis outage)
                return this.fallbackStore.getSession(sessionId);
            }
            try {
                return JSON.parse(resolvedData);
            }
            catch {
                return null;
            }
        }
        catch (redisErr) {
            console.warn(`[secure-web-token] REDIS ERROR: Failed to get session from Redis. ` +
                `Falling back to In-Memory store. Error: ${redisErr.message}`);
            return this.fallbackStore.getSession(sessionId);
        }
    }
    async revokeSession(sessionId) {
        const key = this.getKey(sessionId);
        try {
            if (typeof this.client.del !== "function") {
                throw new Error("Redis client does not support .del() method");
            }
            const res = this.client.del(key);
            if (res instanceof Promise)
                await res;
        }
        catch (redisErr) {
            console.warn(`[secure-web-token] REDIS ERROR: Failed to revoke session in Redis. ` +
                `Falling back to In-Memory store. Error: ${redisErr.message}`);
        }
        finally {
            // Always guarantee revocation in fallback store as well
            this.fallbackStore.revokeSession(sessionId);
        }
    }
}
exports.RedisStore = RedisStore;
