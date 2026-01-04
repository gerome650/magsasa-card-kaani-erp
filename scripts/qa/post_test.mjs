#!/usr/bin/env node
// scripts/qa/post_test.mjs
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';

const PROXY_PORT = process.env.PROXY_PORT || process.env.PORT || 3007;
const PROXY_BASE = `http://localhost:${PROXY_PORT}/api/trpc`;

const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

async function run() {
  const url = `${PROXY_BASE}/auth.demoLogin?batch=1`;
  const bodyObj = { input: { username: "manager", password: "demo123" } };
  const body = JSON.stringify(bodyObj);
  const outPath = '/tmp/post_test_output.txt';
  const start = Date.now();
  try {
    console.log("post_test: PROXY_BASE =", PROXY_BASE);
    console.log("post_test: sending POST to", url);
    const resp = await fetchWithCookies(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body,
    });

    const duration = Date.now() - start;
    const headers = {};
    for (const [k,v] of resp.headers.entries()) headers[k]=v;
    const text = await resp.text();
    const result = {
      ts: new Date().toISOString(),
      url,
      status: resp.status,
      ok: resp.ok,
      duration_ms: duration,
      headers,
      body_preview: text ? text.slice(0, 8000) : "",
      body_length: text.length,
      cookieJar: await jar.getCookieString(url)
    };
    await fs.promises.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log("post_test: wrote result to", outPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    const errObj = {
      ts: new Date().toISOString(),
      url,
      error: String(err && err.message ? err.message : err),
      stack: err && err.stack ? err.stack : null,
      duration_ms: Date.now() - start
    };
    try {
      await fs.promises.writeFile('/tmp/post_test_output.txt', JSON.stringify(errObj, null,2), 'utf8');
    } catch(e){}
    console.error("post_test: error:", errObj);
    process.exitCode = 1;
  }
}

run();

