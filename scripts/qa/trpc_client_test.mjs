#!/usr/bin/env node
// scripts/qa/trpc_client_test.mjs
import superjson from 'superjson';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';

const PROXY_PORT = process.env.PROXY_PORT || process.env.PORT || 3007;
const PROXY_BASE = `http://localhost:${PROXY_PORT}/api/trpc`;
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

async function run() {
  const outPath = '/tmp/trpc_client_test_output.txt';
  const start = Date.now();
  try {
    console.log("trpc_client_test: PROXY_BASE =", PROXY_BASE);
    const trpc = createTRPCProxyClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: PROXY_BASE,
          fetch: fetchWithCookies,
        })
      ]
    });

    console.log("trpc_client_test: calling auth.demoLogin (mutate)");
    const callStart = Date.now();
    const resp = await trpc.auth.demoLogin.mutate({ username: "manager", password: "demo123" });
    const duration = Date.now() - callStart;
    const cookieString = jar.getCookieStringSync ? jar.getCookieStringSync(PROXY_BASE) : (await jar.getCookieString(PROXY_BASE));
    const result = {
      ts: new Date().toISOString(),
      ok: true,
      duration_ms: duration,
      response: resp,
      cookieString
    };
    await fs.promises.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log("trpc_client_test: success:", JSON.stringify(result, null,2));
  } catch (err) {
    const duration = Date.now() - start;
    const errObj = {
      ts: new Date().toISOString(),
      ok: false,
      duration_ms: duration,
      message: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : null,
      extra: err?.data || null
    };
    await fs.promises.writeFile('/tmp/trpc_client_test_output.txt', JSON.stringify(errObj,null,2),'utf8');
    console.error("trpc_client_test: error:", JSON.stringify(errObj,null,2));
    process.exitCode = 1;
  }
}

run();

