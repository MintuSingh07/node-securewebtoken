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
 * Pluggable Redis store adapter.
 * Works with ioredis, redis (npm library), or any client that supports standard get/set/del.
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

    // Support multiple library signatures:
    // node-redis v4 expects client.set(key, value, { EX: ttl })
    // ioredis / older redis expects client.set(key, value, "EX", ttl)
    if (typeof this.client.set === "function") {
      try {
        const res = this.client.set(key, dataStr, { EX: ttl });
        if (res instanceof Promise) await res;
      } catch (err) {
        // Fallback to position arguments
        const res = this.client.set(key, dataStr, "EX", ttl);
        if (res instanceof Promise) await res;
      }
    } else {
      throw new Error("Redis client does not support .set() method");
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const key = this.getKey(sessionId);
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
  }

  async revokeSession(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId);
    if (typeof this.client.del !== "function") {
      throw new Error("Redis client does not support .del() method");
    }

    const res = this.client.del(key);
    if (res instanceof Promise) await res;
  }
}
