import { Store, Session } from "./types";
export declare class MemoryStore implements Store {
    private sessions;
    registerSession(session: Session): void;
    getSession(sessionId: string): Session | null;
    revokeSession(sessionId: string): void;
}
export declare const memoryStore: MemoryStore;
//# sourceMappingURL=memoryStore.d.ts.map