#!/usr/bin/env node
// scripts/qa/proxy.mjs
import http from "http";
import fetch from "node-fetch";
import superjson from "superjson";

const UPSTREAM = process.env.UPSTREAM || "http://localhost:3012";
const LISTEN_PORT = Number(process.env.PROXY_PORT || process.env.PORT || 3007);

function isJsonContentType(headers) {
  const ct = headers.get("content-type") || headers.get("Content-Type") || "";
  return ct.includes("application/json") || ct.includes("application/trpc+json") || ct.includes("application/trpc");
}

function normalizeSetCookie(headers) {
  // node-fetch returns headers as Headers object; upstream Set-Cookie may be multiple.
  const sc = headers.raw ? headers.raw()["set-cookie"] || headers.raw()["Set-Cookie"] || null : null;
  return sc;
}

async function transformBodyIfNeeded(path, upstreamRes, bodyText) {
  if (!bodyText) return { transformed: false, body: bodyText };

  // try to parse JSON
  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    // not JSON, don't transform
    return { transformed: false, body: bodyText };
  }

  // if parsed looks like superjson wire format (top-level json & meta), do nothing
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    return { transformed: false, body: bodyText };
  }

  // Determine the actual payload to serialize:
  let payloadToSerialize = parsed;
  // If parsed has 'json' key (tRPC batch-ish) but no 'meta', use parsed.json
  if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "json") && !Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    payloadToSerialize = parsed.json;
  }

  // Now serialize using superjson
  try {
    const serialized = superjson.serialize(payloadToSerialize);
    const out = JSON.stringify(serialized);
    console.log(`proxy: transformed response for ${path} status=${upstreamRes.status} -> superjson keys=${Object.keys(serialized).join(",")}`);
    return { transformed: true, body: out };
  } catch (err) {
    console.error("proxy: superjson.serialize failed:", err && err.message ? err.message : err);
    // fallback: return original body
    return { transformed: false, body: bodyText };
  }
}

const server = http.createServer(async (req, res) => {
  const upstreamUrl = `${UPSTREAM}${req.url}`;
  try {
    // forward headers, remove hop-by-hop headers that shouldn't be forwarded
    const forwardedHeaders = {};
    for (const [k, v] of Object.entries(req.headers)) {
      // skip host header to avoid confusion
      if (k.toLowerCase() === "host") continue;
      forwardedHeaders[k] = v;
    }

    // build fetch options
    const opts = {
      method: req.method,
      headers: forwardedHeaders,
      // pass body if present:
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      redirect: "manual",
    };

    // fetch upstream and get full response
    const upstreamRes = await fetch(upstreamUrl, opts);

    // read all headers and body
    const upstreamHeaders = upstreamRes.headers;
    const bodyText = await upstreamRes.text();

    // check content type
    if (isJsonContentType(upstreamHeaders)) {
      const { transformed, body } = await transformBodyIfNeeded(req.url, upstreamRes, bodyText);
      // Forward headers (excluding content-length/content-encoding if we change the body)
      // Copy upstream headers except hop-by-hop
      for (const [key, value] of upstreamHeaders.entries()) {
        const k = key.toLowerCase();
        if (["transfer-encoding", "content-length", "content-encoding"].includes(k)) continue;
        // We will set set-cookie explicitly below
        if (k === "set-cookie") continue;
        res.setHeader(key, value);
      }
      // Forward Set-Cookie headers as array if present
      const cookies = normalizeSetCookie(upstreamHeaders);
      if (cookies) {
        // cookies is an array
        res.setHeader("Set-Cookie", cookies);
        console.log(`proxy: forwarding Set-Cookie for ${req.url} -> ${Array.isArray(cookies) ? cookies.length : 1}`);
      }

      // Ensure content-type is application/json
      res.setHeader("Content-Type", "application/json");

      // Set content-length for the new body
      const buf = Buffer.from(body, "utf8");
      res.setHeader("Content-Length", String(buf.length));

      // send status and body
      res.writeHead(upstreamRes.status);
      res.end(buf);
      return;
    }

    // Non-JSON: forward headers and body as-is
    for (const [key, value] of upstreamHeaders.entries()) {
      if (key.toLowerCase() === "set-cookie") continue; // handle below
      res.setHeader(key, value);
    }
    const cookies = normalizeSetCookie(upstreamHeaders);
    if (cookies) {
      res.setHeader("Set-Cookie", cookies);
    }
    // set content-length if known
    if (!res.getHeader("Content-Length")) {
      res.setHeader("Content-Length", Buffer.byteLength(bodyText, "utf8")); // conservative
    }
    res.writeHead(upstreamRes.status);
    res.end(bodyText);
  } catch (err) {
    console.error("proxy: error proxying request:", err && err.message ? err.message : err);
    res.writeHead(502, { "Content-Type": "application/json" });
    const errObj = { error: { message: "Proxy upstream error", details: String(err && err.message ? err.message : err) } };
    res.end(JSON.stringify(errObj));
  }
});

server.on("listening", () => {
  console.log(`proxy: listening on port ${LISTEN_PORT}, forwarding to ${UPSTREAM}`);
});

server.listen(LISTEN_PORT);
