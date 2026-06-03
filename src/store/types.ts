/**
 * Schema for stored session details.
 */
export interface Session {
    sessionId: string;
    userId: string | number;
    deviceId: string;
    fingerprint: string;
    clientPublicKey?: string;
}

/**
 * Interface for session storage backends.
 */
export interface Store {
    /**
     * Registers a new session in the store.
     * @param session - The session details to store.
     */
    registerSession(session: Session): Promise<void> | void;

    /**
     * Retrieves a session by its ID.
     * @param sessionId - The unique identifier for the session.
     * @returns The session details or null if not found.
     */
    getSession(sessionId: string): Promise<Session | null> | Session | null;

    /**
     * Revokes (removes) a session from the store.
     * @param sessionId - The unique identifier for the session to revoke.
     */
    revokeSession(sessionId: string): Promise<void> | void;
}

