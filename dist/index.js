"use strict";
/**
 * Secure Web Token (SWT)
 * Encrypted, device-bound alternative to JWT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = exports.verify = exports.sign = void 0;
var sign_1 = require("./sign");
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return __importDefault(sign_1).default; } });
var verify_1 = require("./verify");
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return __importDefault(verify_1).default; } });
// Export store helpers
var store_1 = require("./store");
Object.defineProperty(exports, "getStore", { enumerable: true, get: function () { return store_1.getStore; } });
