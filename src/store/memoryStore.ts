import { Store } from "./types";

interface Session {
    sessionId: string;
    userId: string | number;
    deviceId: string;
    fingerprint: string;
}

class MemoryStore implements Store {
    private sessions = new Map<string, Session>();

    registerSession(session: Session) {
        this.sessions.set(session.sessionId, session);
    }

    getSession(sessionId: string): Session | null {
        return this.sessions.get(sessionId) || null;
    }

    revokeSession(sessionId: string) {
        this.sessions.delete(sessionId);
    }
}

export const memoryStore: MemoryStore = new MemoryStore();
