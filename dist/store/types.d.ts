/**
 * Interface for session storage backends.
 */
export interface Store {
    /**
     * Registers a new session in the store.
     * @param session - The session details to store.
     */
    registerSession(session: {
        sessionId: string;
        userId: string | number;
        deviceId: string;
        fingerprint: string;
    }): void;
    /**
     * Retrieves a session by its ID.
     * @param sessionId - The unique identifier for the session.
     * @returns The session details or null if not found.
     */
    getSession(sessionId: string): {
        sessionId: string;
        userId: string | number;
        deviceId: string;
        fingerprint: string;
    } | null;
    /**
     * Revokes (removes) a session from the store.
     * @param sessionId - The unique identifier for the session to revoke.
     */
    revokeSession(sessionId: string): void;
}
//# sourceMappingURL=types.d.ts.map