"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
/**
 * Safely invokes a configured audit logger callback.
 * Prevents throwing errors into the main application flow if the logger fails.
 */
async function logEvent(logger, event) {
    if (!logger)
        return;
    try {
        const fullEvent = {
            ...event,
            timestamp: Date.now(),
        };
        const res = logger(fullEvent);
        if (res instanceof Promise) {
            await res;
        }
    }
    catch (err) {
        // Fail-safe: do not crash authentication due to audit log failure.
        console.error("[SWT AuditLogger Error]:", err);
    }
}
