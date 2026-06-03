import { Store, Session } from "./types";

export class MemoryStore implements Store {
    private sessions = new Map<string, Session>();

    registerSession(session: Session): void {
        this.sessions.set(session.sessionId, session);
    }

    getSession(sessionId: string): Session | null {
        return this.sessions.get(sessionId) || null;
    }

    revokeSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}

export const memoryStore: MemoryStore = new MemoryStore();

