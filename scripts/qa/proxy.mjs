#!/usr/bin/env node
// scripts/qa/proxy.mjs - verbose diagnostic proxy for QA
import http from "http";
import fetch from "node-fetch";
import superjson from "superjson";
import { URL } from "url";
import { promisify } from "util";
import fs from "fs";

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);

const UPSTREAM = process.env.UPSTREAM || "http://localhost:3012";
const LISTEN_PORT = Number(process.env.PROXY_PORT || process.env.PORT || 3007);

// helpers
function nowTs() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function isJsonContentType(headers) {
  const ct = headers.get("content-type") || headers.get("Content-Type") || "";
  return ct.toLowerCase().includes("application/json") ||
         ct.toLowerCase().includes("application/trpc+json") ||
         ct.toLowerCase().includes("application/trpc") ||
         ct.toLowerCase().includes("text/json");
}

async function collectRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function normalizeSetCookie(headers) {
  try {
    const raw = headers.raw ? headers.raw() : {};
    return raw["set-cookie"] || raw["Set-Cookie"] || null;
  } catch (e) {
    return null;
  }
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

async function dumpDiagnostic(name, content) {
  const fn = `/tmp/proxy_diag_${name}_${nowTs()}.txt`;
  try {
    await writeFile(fn, typeof content === "string" ? content : JSON.stringify(content, null, 2), "utf8");
  } catch (e) {
    // best-effort
  }
  return fn;
}

async function transformBodyIfNeeded(path, upstreamRes, bodyText) {
  if (!bodyText) return { transformed: false, body: bodyText, reason: "empty body" };

  // Attempt parse
  let parsed = null;
  try { parsed = JSON.parse(bodyText); } catch (e) {
    return { transformed: false, body: bodyText, reason: "not-json" };
  }

  // If already superjson wire format (json + meta) -> skip transformation
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    return { transformed: false, body: bodyText, reason: "already_superjson" };
  }

  // If parsed has json wrapper (tRPC-batch shape) and no meta, extract parsed.json
  let payloadToSerialize = parsed;
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && !Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    payloadToSerialize = parsed.json;
  }

  try {
    const serialized = superjson.serialize(payloadToSerialize);
    const out = JSON.stringify(serialized);
    return { transformed: true, body: out, reason: "serialized_to_superjson", serializedKeys: Object.keys(serialized) };
  } catch (err) {
    return { transformed: false, body: bodyText, reason: `superjson_error: ${err && err.message ? err.message : String(err)}` };
  }
}

// Main server
const server = http.createServer(async (req, res) => {
  const upstreamUrl = `${UPSTREAM}${req.url}`;
  const path = req.url || "/";
  const startTs = Date.now();

  // Collect incoming request body (for non-GET/HEAD)
  let bodyBuffer;
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      bodyBuffer = await collectRequestBody(req);
    }
  } catch (e) {
    console.error("proxy: error collecting request body:", e && e.message ? e.message : e);
    bodyBuffer = undefined;
  }

  // Verbose request logging (first 2000 chars)
  try {
    const reqLog = {
      ts: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyPreview: bodyBuffer ? bodyBuffer.toString("utf8", 0, 2000) : "<no-body>",
      bodyLength: bodyBuffer ? bodyBuffer.length : 0,
    };
    console.log("proxy:req:", JSON.stringify(reqLog));
    if (req.url && req.url.includes("auth.demoLogin")) {
      const dumpName = await dumpDiagnostic(`auth.req${req.method}`, reqLog);
      console.log(`proxy: dumped auth request to ${dumpName}`);
    }
  } catch (e) {}

  // Build fetch headers
  const forwardedHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === "host") continue;
    if (["connection", "transfer-encoding"].includes(k.toLowerCase())) continue;
    forwardedHeaders[k] = v;
  }
  // Ensure content-length matches buffer if we have one
  if (bodyBuffer) forwardedHeaders["content-length"] = String(bodyBuffer.length);

  try {
    const fetchOpts = {
      method: req.method,
      headers: forwardedHeaders,
      redirect: "manual",
      body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
    };

    const upstreamRes = await fetch(upstreamUrl, fetchOpts);
    const upstreamHeaders = upstreamRes.headers;
    const bodyText = await upstreamRes.text();

    // Ready diagnostic object
    const upstreamLog = {
      ts: new Date().toISOString(),
      url: upstreamUrl,
      status: upstreamRes.status,
      headers: Object.fromEntries(upstreamHeaders.entries ? upstreamHeaders.entries() : []),
      bodyPreview: bodyText ? bodyText.slice(0, 4000) : "<empty>",
      bodyLength: bodyText ? bodyText.length : 0,
    };

    // Special auth.demoLogin diagnostics: dump raw upstream response to /tmp
    if (path && path.includes("auth.demoLogin")) {
      const fnResp = await dumpDiagnostic("auth.upstream_resp", upstreamLog);
      console.log(`proxy: dumped auth upstream response to ${fnResp}`);
    }

    // Log upstream summary
    console.log("proxy:upstream:", JSON.stringify(upstreamLog));

    // Determine content-type and transform if needed
    const isJson = isJsonContentType(upstreamHeaders);
    if (isJson) {
      const transformResult = await transformBodyIfNeeded(path, upstreamRes, bodyText);

      // Detailed logging for transform decision
      console.log(`proxy: transformDecision for ${path} status=${upstreamRes.status} -> transformed=${transformResult.transformed} reason=${transformResult.reason}${transformResult.serializedKeys ? " keys="+transformResult.serializedKeys.join(",") : ""}`);

      // If transformation occurred, set headers accordingly and return transformed body
      for (const [key, value] of upstreamHeaders.entries()) {
        const kk = key.toLowerCase();
        if (["transfer-encoding", "content-length", "content-encoding"].includes(kk)) continue;
        if (kk === "set-cookie") continue;
        res.setHeader(key, value);
      }

      const cookies = normalizeSetCookie(upstreamHeaders);
      if (cookies) {
        res.setHeader("Set-Cookie", cookies);
        console.log(`proxy: forwarding Set-Cookie for ${path} -> ${Array.isArray(cookies) ? cookies.length : 1}`);
      }

      res.setHeader("Content-Type", "application/json");
      const outBody = transformResult.body;
      const outBuf = Buffer.from(outBody, "utf8");
      res.setHeader("Content-Length", String(outBuf.length));
      res.writeHead(upstreamRes.status);
      res.end(outBuf);
      return;
    }

    // Non-JSON: forward headers & body verbatim, preserving Set-Cookie
    for (const [key, value] of upstreamHeaders.entries()) {
      const kk = key.toLowerCase();
      if (kk === "set-cookie") continue;
      res.setHeader(key, value);
    }
    const cookies = normalizeSetCookie(upstreamHeaders);
    if (cookies) res.setHeader("Set-Cookie", cookies);
    const outBody = bodyText || "";
    if (!res.getHeader("Content-Length")) {
      res.setHeader("Content-Length", Buffer.byteLength(outBody, "utf8"));
    }
    res.writeHead(upstreamRes.status);
    res.end(outBody);
  } catch (err) {
    console.error("proxy: unexpected error:", err && err.message ? err.message : err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "proxy upstream error", details: String(err && err.message ? err.message : err) } }));
  } finally {
    // small perf note: log latency if desired
  }
});

server.on("listening", () => {
  console.log(`proxy: listening on port ${LISTEN_PORT}, forwarding to ${UPSTREAM}`);
});
server.listen(LISTEN_PORT);
