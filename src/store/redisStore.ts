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
 * Redis-backed session store for SWT.
 * Provides true logout and admin session revocation capabilities.
 * Works with ioredis, redis (npm), or any client supporting standard get/set/del.
 *
 * Errors propagate directly — if Redis is unreachable, operations fail
 * with clear error messages rather than silently degrading.
 */
export class RedisStore implements Store {
  private client: any;
  private options: RedisStoreOptions;

  constructor(client: any, options: RedisStoreOptions = {}) {
    if (!client) {
      throw new Error("Redis client instance is required");
    }
    this.client = client;
    this.options = options;
  }

  private getKey(sessionId: string): string {
    const prefix = this.options.prefix ?? "swt:session:";
    return `${prefix}${sessionId}`;
  }

  async registerSession(session: Session): Promise<void> {
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
        if (res instanceof Promise) await res;
      } catch {
        // ioredis style: set(key, value, "EX", ttl)
        const res = this.client.set(key, dataStr, "EX", ttl);
        if (res instanceof Promise) await res;
      }
    } catch (err: any) {
      throw new Error(`[secure-web-token] Redis error during session registration: ${err.message}`);
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const key = this.getKey(sessionId);
    try {
      if (typeof this.client.get !== "function") {
        throw new Error("Redis client does not support .get() method");
      }

      const data = this.client.get(key);
      const resolvedData = data instanceof Promise ? await data : data;

      if (!resolvedData) return null;

      try {
        return JSON.parse(resolvedData) as Session;
      } catch {
        return null;
      }
    } catch (err: any) {
      throw new Error(`[secure-web-token] Redis error during session retrieval: ${err.message}`);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId);
    try {
      if (typeof this.client.del !== "function") {
        throw new Error("Redis client does not support .del() method");
      }

      const res = this.client.del(key);
      if (res instanceof Promise) await res;
    } catch (err: any) {
      throw new Error(`[secure-web-token] Redis error during session revocation: ${err.message}`);
    }
  }
}
