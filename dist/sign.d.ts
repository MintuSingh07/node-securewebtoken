import { StoreType } from "./store";
export interface SignOptions {
    expiresIn?: number;
    fingerprint?: true;
    store?: StoreType;
}
/**
 * sign() now returns:
 * - token (encrypted payload)
 * - sessionId (to store in HttpOnly cookie)
 */
export default function sign(data: Record<string, any>, secret: string, options?: SignOptions): {
    token: string;
    sessionId?: string;
};
//# sourceMappingURL=sign.d.ts.map