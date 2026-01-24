import { randomUUID } from "crypto";

/**
 * Generates a unique device identifier
 */
export function generateDeviceId(): string {
  return randomUUID();
}
