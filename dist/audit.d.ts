/**
 * Event names that can be generated during token operations.
 */
export type AuditEventName = "sign" | "verify_success" | "verify_failure" | "revoke" | "refresh";
/**
 * Structured schema representing a single audit log entry.
 */
export interface AuditLogEvent {
    /**
     * The identifier of the action performed.
     */
    event: AuditEventName;
    /**
     * The associated user ID, if applicable.
     */
    userId?: string | number;
    /**
     * The session ID, if stateful tracking is enabled.
     */
    sessionId?: string;
    /**
     * Explanatory text, typically populated for failures.
     */
    reason?: string;
    /**
     * Unix timestamp of the event in milliseconds.
     */
    timestamp: number;
}
/**
 * Developer callback function signature for intercepting audit logs.
 */
export type AuditLogger = (event: AuditLogEvent) => void | Promise<void>;
/**
 * Safely invokes a configured audit logger callback.
 * Prevents throwing errors into the main application flow if the logger fails.
 */
export declare function logEvent(logger: AuditLogger | undefined, event: Omit<AuditLogEvent, "timestamp">): Promise<void>;
//# sourceMappingURL=audit.d.ts.map