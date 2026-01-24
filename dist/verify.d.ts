import { StoreType } from "./store";
export interface VerifyOptions {
    sessionId?: string;
    fingerprint?: string;
    store?: StoreType;
}
export default function verify(token: string, secret: string, options?: VerifyOptions): Record<string, any>;
//# sourceMappingURL=verify.d.ts.map