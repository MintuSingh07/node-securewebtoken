import { Store } from "./types";
interface Session {
    sessionId: string;
    userId: string | number;
    deviceId: string;
    fingerprint: string;
}
declare class MemoryStore implements Store {
    private sessions;
    registerSession(session: Session): void;
    getSession(sessionId: string): Session | null;
    revokeSession(sessionId: string): void;
}
export declare const memoryStore: MemoryStore;
export {};
//# sourceMappingURL=memoryStore.d.ts.map