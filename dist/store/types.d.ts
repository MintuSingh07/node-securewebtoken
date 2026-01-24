export interface Store {
    registerSession(session: {
        sessionId: string;
        userId: string | number;
        deviceId: string;
        fingerprint: string;
    }): void;
    getSession(sessionId: string): {
        sessionId: string;
        userId: string | number;
        deviceId: string;
        fingerprint: string;
    } | null;
    revokeSession(sessionId: string): void;
}
//# sourceMappingURL=types.d.ts.map