/**
 * /tmp/trpc_client_debug.mjs
 * - Uses @trpc/client with superjson
 * - Uses a custom fetch wrapper that logs request/response to files
 * - Performs auth.demoLogin mutation (username=manager/demo123)
 *
 * Note: run with Node v18+ or with node --experimental-fetch; we use node-fetch v3 (Response class)
 */
import fs from 'fs/promises';
import fetch, { Response } from 'node-fetch';
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const PROXY_BASE = process.env.PROXY_BASE || 'http://localhost:3007/api/trpc';
const REQ_LOG = process.env.REQ_LOG || '/tmp/trpc_client_request.txt';
const RESP_LOG = process.env.RESP_LOG || '/tmp/trpc_client_response.txt';

// debugFetch: logs request (url, headers, body) then forwards to node-fetch,
// captures response text and writes status/headers/body to RESP_LOG, then returns a Response that tRPC expects.
async function debugFetch(url, options={}) {
  try {
    const headers = (options.headers && typeof options.headers.forEach !== 'function') ? options.headers : Object.fromEntries(options.headers || []);
    const body = options.body ?? null;

    // write request log
    await fs.writeFile(REQ_LOG, JSON.stringify({ url, method: options.method, headers, body: (typeof body === 'string' ? body : '<non-string body>' ) }, null, 2));

    // perform actual fetch
    const resp = await fetch(url, options);

    // extract headers
    const respHeaders = {};
    resp.headers.forEach((v,k)=>respHeaders[k]=v);

    // read response body as text
    const text = await resp.text();

    // write response log
    await fs.writeFile(RESP_LOG, JSON.stringify({ status: resp.status, headers: respHeaders, body: text }, null, 2));

    // return a new Response so @trpc/client can consume it
    return new Response(text, { status: resp.status, headers: respHeaders });
  } catch (err) {
    // log failure
    await fs.writeFile(RESP_LOG, JSON.stringify({ error: String(err), stack: err && err.stack ? err.stack : null }, null, 2));
    throw err;
  }
}

(async function main(){
  // create tRPC client with httpBatchLink and debugFetch
  const client = createTRPCProxyClient({
    links: [ httpBatchLink({ url: PROXY_BASE, fetch: debugFetch }) ],
    transformer: superjson,
  });

  try {
    // Try the mutation - uses same shape as your smoke test
    console.log("Attempting manager login via @trpc/client -> auth.demoLogin");
    const result = await client.auth.demoLogin.mutate({ username: "manager", password: "demo123" });
    console.log("Login result (client):", JSON.stringify(result, null, 2));
    // Show the raw logs as well
    const req = await fs.readFile(REQ_LOG, "utf8").catch(()=>null);
    const resp = await fs.readFile(RESP_LOG, "utf8").catch(()=>null);
    console.log("\n=== Raw request log ===\n", req);
    console.log("\n=== Raw response log ===\n", resp);
    process.exit(0);
  } catch (err) {
    console.error("Mutation error (client):", err && err.message ? err.message : String(err));
    // Print raw logs
    const req = await fs.readFile(REQ_LOG, "utf8").catch(()=>null);
    const resp = await fs.readFile(RESP_LOG, "utf8").catch(()=>null);
    console.log("\n=== Raw request log ===\n", req);
    console.log("\n=== Raw response log ===\n", resp);

    // parse response body to check format
    try {
      const R = JSON.parse(resp).body;
      let body = R;
      try { body = JSON.parse(R); } catch(e){}
      console.log("\n=== Parsed response body (first 2000 chars) ===\n", typeof body === 'string' ? body.slice(0,2000) : JSON.stringify(body, null, 2).slice(0,2000));
      // Check for wire format
      if (typeof body === 'object' && body !== null) {
        const topKeys = Object.keys(body);
        if (topKeys.includes('json') && topKeys.includes('meta')) {
          console.log("\nResponse appears to be a top-level superjson wire object (json+meta).");
        } else if (Array.isArray(body)) {
          console.log("\nResponse appears to be a tRPC batch array (array). First element keys:", Object.keys(body[0] || {}));
        } else {
          console.log("\nResponse is an object without both json+meta. Keys:", topKeys);
        }
      }
    } catch(e) {
      console.log("Could not parse response log/JSON:", e);
    }

    process.exit(1);
  }
})();

