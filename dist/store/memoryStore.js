"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = void 0;
class MemoryStore {
    constructor() {
        this.sessions = new Map();
    }
    registerSession(session) {
        this.sessions.set(session.sessionId, session);
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    revokeSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}
exports.memoryStore = new MemoryStore();
