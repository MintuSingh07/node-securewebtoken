"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStore = void 0;
/**
 * Redis-backed session store for SWT.
 * Provides true logout and admin session revocation capabilities.
 * Works with ioredis, redis (npm), or any client supporting standard get/set/del.
 *
 * Errors propagate directly — if Redis is unreachable, operations fail
 * with clear error messages rather than silently degrading.
 */
class RedisStore {
    constructor(client, options = {}) {
        if (!client) {
            throw new Error("Redis client instance is required");
        }
        this.client = client;
        this.options = options;
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
            if (typeof this.client.set !== "function") {
                throw new Error("Redis client does not support .set() method");
            }
            try {
                // node-redis style: set(key, value, { EX: ttl })
                const res = this.client.set(key, dataStr, { EX: ttl });
                if (res instanceof Promise)
                    await res;
            }
            catch {
                // ioredis style: set(key, value, "EX", ttl)
                const res = this.client.set(key, dataStr, "EX", ttl);
                if (res instanceof Promise)
                    await res;
            }
        }
        catch (err) {
            throw new Error(`[secure-web-token] Redis error during session registration: ${err.message}`);
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
            if (!resolvedData)
                return null;
            try {
                return JSON.parse(resolvedData);
            }
            catch {
                return null;
            }
        }
        catch (err) {
            throw new Error(`[secure-web-token] Redis error during session retrieval: ${err.message}`);
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
        catch (err) {
            throw new Error(`[secure-web-token] Redis error during session revocation: ${err.message}`);
        }
    }
}
exports.RedisStore = RedisStore;
