"use strict";
/**
 * Secure Web Token (SWT) v3.0
 * Encrypted, DPoP-bound alternative to JWT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeJwkThumbprint = exports.RedisStore = exports.swtMiddleware = exports.refresh = exports.verify = exports.sign = void 0;
var sign_1 = require("./sign");
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return __importDefault(sign_1).default; } });
var verify_1 = require("./verify");
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return __importDefault(verify_1).default; } });
var refresh_1 = require("./refresh");
Object.defineProperty(exports, "refresh", { enumerable: true, get: function () { return __importDefault(refresh_1).default; } });
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "swtMiddleware", { enumerable: true, get: function () { return middleware_1.swtMiddleware; } });
// Export store (Redis only in v3)
var store_1 = require("./store");
Object.defineProperty(exports, "RedisStore", { enumerable: true, get: function () { return store_1.RedisStore; } });
// Export DPoP utilities
var dpop_1 = require("./dpop");
Object.defineProperty(exports, "computeJwkThumbprint", { enumerable: true, get: function () { return dpop_1.computeJwkThumbprint; } });
