# tRPC Batch Handling (canonical)

This doc captures the canonical rules and rationale for handling tRPC batch payloads in our stack.

## Proxy rules

1. **Pass through top-level arrays for tRPC batch responses.** Do not wrap top-level arrays in a superjson wire object. Example:

   - **Correct (pass-through):** `[{"result":{"data":{"json":{...}}}}]`
   - **Incorrect:** `{"json":[{...}],"meta":null}`

2. **Preserve top-level `{"input": {...}}` bodies** when present (single-call style); do not turn them into keyed objects unless the server expects `?batch=1` keyed-object format.

## Server rules

Add a pre-tRPC middleware that:

1. **Guarantees `req.body` exists** before the tRPC adapter reads the stream.

2. **For `?batch=1`, normalizes incoming bodies into a keyed-object format:** `{'0': <input0>, '1': <input1>, ...}`.

3. **If the client sends `{"input": {...}}` and `?batch=1` is present**, transform to `{'0': {...}}`.

4. **If the client sends a raw array `[{...}]`**, transform to keyed-object `{'0': {...}}` for tRPC's parser.

## Rationale

The `@trpc/client` `httpBatchLink` and server `createExpressMiddleware` expect particular shapes. These transformations ensure consistency across client, proxy, and server without changing tRPC internals.

## CI / Enforcement

A QA smoke test (`qa-smoke-proxy.yml`) is used to verify end-to-end correctness. CI must run a smoke test that:

- Starts the backend
- Starts the proxy
- Runs the smoke test using `@trpc/client` with superjson + cookie-aware fetch
- Asserts manager login returns status 200 and cookies are set

## Regression tests

Tests to add:

- Single-call non-batch: `{"input": {...}}` -> server expects input
- Batch keyed-object: `{'0': {...}, '1': {...}}`
- Batch array: `[{...},{...}]` -> normalized to keyed-object
- Edge cases: `[{ "path": "...", "input": {...}}]`, `{"0": {"input": {...}}}`

## References

- Proxy implementation: `scripts/qa/proxy.mjs`
- Server pre-tRPC middleware: `server/_core/index.ts`
- PRs: #16 (CI), #17 (proxy), #18 (server)
