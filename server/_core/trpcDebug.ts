/**
 * tRPC debug logging helper
 * Only logs when TRPC_DEBUG=1 and NODE_ENV=development
 * 
 * Usage:
 *   import { trpcDbg } from "./_core/trpcDebug";
 *   trpcDbg("[tag] message", data);
 */
const TRPC_DEBUG = process.env.TRPC_DEBUG === "1" && process.env.NODE_ENV === "development";

export function trpcDbg(...args: any[]): void {
  if (TRPC_DEBUG) {
    console.log(...args);
  }
}
