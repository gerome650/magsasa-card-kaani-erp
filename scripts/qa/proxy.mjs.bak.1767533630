#!/usr/bin/env node
import http from "http";
import fetch from "node-fetch";
import superjson from "superjson";

// Configuration
const UPSTREAM = process.env.UPSTREAM || "http://localhost:3012";
const LISTEN_PORT = Number(process.env.PROXY_PORT || process.env.PORT || 3007);

function isJsonContentType(headers) {
  const ct = headers.get("content-type") || headers.get("Content-Type") || "";
  return ct.includes("application/json") || ct.includes("application/trpc+json") || ct.includes("application/trpc");
}

// helper: read full request body into a Buffer
async function collectRequestBody(req) {
  // Works for incoming http.IncomingMessage (readable stream)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function normalizeSetCookie(headers) {
  // node-fetch Headers.raw() returns arrays for header names
  try {
    const raw = headers.raw ? headers.raw() : {};
    return raw["set-cookie"] || raw["Set-Cookie"] || null;
  } catch (e) {
    return null;
  }
}

async function transformBodyIfNeeded(path, upstreamRes, bodyText) {
  if (!bodyText) return { transformed: false, body: bodyText };

  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    return { transformed: false, body: bodyText };
  }

  // If already superjson wire format -> skip
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    return { transformed: false, body: bodyText };
  }

  let payloadToSerialize = parsed;
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && !Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    payloadToSerialize = parsed.json;
  }

  try {
    const serialized = superjson.serialize(payloadToSerialize);
    const out = JSON.stringify(serialized);
    console.log(`proxy: transformed response for ${path} status=${upstreamRes.status} -> superjson keys=${Object.keys(serialized).join(",")}`);
    return { transformed: true, body: out };
  } catch (err) {
    console.error("proxy: superjson.serialize failed:", err && err.message ? err.message : err);
    return { transformed: false, body: bodyText };
  }
}

const server = http.createServer(async (req, res) => {
  const upstreamUrl = `${UPSTREAM}${req.url}`;
  try {
    // collect request body for non-GET/HEAD
    let bodyBuffer = undefined;
    if (!["GET","HEAD"].includes(req.method)) {
      try {
        bodyBuffer = await collectRequestBody(req);
      } catch (e) {
        console.error("proxy: error collecting request body:", e && e.message ? e.message : e);
        // proceed with undefined body (best-effort)
      }
    }

    // Forward headers (exclude Host)
    const forwardedHeaders = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (k.toLowerCase() === "host") continue;
      // Don't forward certain hop-by-hop headers if present
      if (["connection","transfer-encoding"].includes(k.toLowerCase())) continue;
      forwardedHeaders[k] = v;
    }

    // If we buffered a body, ensure content-length is correct
    if (bodyBuffer) {
      forwardedHeaders["content-length"] = String(bodyBuffer.length);
    }

    const fetchOpts = {
      method: req.method,
      headers: forwardedHeaders,
      redirect: "manual",
      // node-fetch accepts Buffer as body
      body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
    };

    const upstreamRes = await fetch(upstreamUrl, fetchOpts);

    const upstreamHeaders = upstreamRes.headers;
    const bodyText = await upstreamRes.text();

    if (isJsonContentType(upstreamHeaders)) {
      const { transformed, body } = await transformBodyIfNeeded(req.url, upstreamRes, bodyText);

      // forward headers except hop-by-hop and content-length/content-encoding (we set content-length)
      for (const [key, value] of upstreamHeaders.entries()) {
        const kk = key.toLowerCase();
        if (["transfer-encoding","content-length","content-encoding"].includes(kk)) continue;
        if (kk === "set-cookie") continue; // handled separately
        res.setHeader(key, value);
      }

      const cookies = normalizeSetCookie(upstreamHeaders);
      if (cookies) {
        res.setHeader("Set-Cookie", cookies);
        console.log(`proxy: forwarding Set-Cookie for ${req.url} -> ${Array.isArray(cookies) ? cookies.length : 1}`);
      }

      res.setHeader("Content-Type", "application/json");
      const buf = Buffer.from(body, "utf8");
      res.setHeader("Content-Length", String(buf.length));
      res.writeHead(upstreamRes.status);
      res.end(buf);
      return;
    }

    // Non-JSON path: forward headers, cookies, and body
    for (const [key, value] of upstreamHeaders.entries()) {
      const kk = key.toLowerCase();
      if (kk === "set-cookie") continue;
      res.setHeader(key, value);
    }
    const cookies = normalizeSetCookie(upstreamHeaders);
    if (cookies) {
      res.setHeader("Set-Cookie", cookies);
    }

    // ensure content-length
    const outBody = bodyText || "";
    if (!res.getHeader("Content-Length")) {
      res.setHeader("Content-Length", Buffer.byteLength(outBody, "utf8"));
    }
    res.writeHead(upstreamRes.status);
    res.end(outBody);
  } catch (err) {
    console.error("proxy: unexpected error:", err && err.message ? err.message : err);
    res.writeHead(502, {"Content-Type":"application/json"});
    res.end(JSON.stringify({ error: { message: "proxy upstream error", details: String(err && err.message ? err.message : err) } }));
  }
});

server.on("listening", () => {
  console.log(`proxy: listening on port ${LISTEN_PORT}, forwarding to ${UPSTREAM}`);
});
server.listen(LISTEN_PORT);
