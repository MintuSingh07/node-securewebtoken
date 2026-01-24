"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeviceId = generateDeviceId;
const crypto_1 = require("crypto");
/**
 * Generates a unique device identifier
 */
function generateDeviceId() {
    return (0, crypto_1.randomUUID)();
}
