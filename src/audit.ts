/**
 * Event names that can be generated during token operations.
 */
export type AuditEventName =
  | "sign"
  | "verify_success"
  | "verify_failure"
  | "revoke"
  | "refresh";

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
   * The unique device identifier, if device binding is used.
   */
  deviceId?: string;
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
export async function logEvent(
  logger: AuditLogger | undefined,
  event: Omit<AuditLogEvent, "timestamp">
): Promise<void> {
  if (!logger) return;
  try {
    const fullEvent: AuditLogEvent = {
      ...event,
      timestamp: Date.now(),
    };
    const res = logger(fullEvent);
    if (res instanceof Promise) {
      await res;
    }
  } catch (err) {
    // Fail-safe: do not crash authentication due to audit log failure.
    console.error("[SWT AuditLogger Error]:", err);
  }
}
