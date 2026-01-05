#!/usr/bin/env node
/**
 * scripts/qa/proxy.mjs
 * Lightweight proxy that forwards requests to upstream backend and ensures
 * tRPC error/batch responses are returned in superjson wire format:
 * { json: <payload>, meta: <meta> }
 *
 * Usage: PORT=3007 UPSTREAM_PORT=3012 node scripts/qa/proxy.mjs
 */
import http from 'http';
import fetch from 'node-fetch';
import superjson from 'superjson';

const PROXY_PORT = Number(process.env.PORT || process.env.PROXY_PORT || 3007);
const UPSTREAM_PORT = Number(process.env.UPSTREAM_PORT || 3012);
const UPSTREAM_BASE = `http://localhost:${UPSTREAM_PORT}`;

// --- DEBUG HOOK START ---
const _origResEnd = http.ServerResponse.prototype.end;
http.ServerResponse.prototype.end = function (chunk, encoding, cb) {
  try {
    const reqUrl = (this.req && (this.req.originalUrl || this.req.url)) || 'unknown-url';
    const method = this.req && this.req.method;
    const status = this.statusCode;
    // prepare small preview
    let preview = '';
    if (chunk) {
      if (typeof chunk === 'string') preview = chunk.slice(0, 2000);
      else if (Buffer.isBuffer(chunk)) preview = chunk.toString('utf8', 0, 2000);
      else try { preview = JSON.stringify(chunk).slice(0,2000); } catch(e){ preview = String(chunk).slice(0,2000); }
    }
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      proxy_dbg_res_end: { url: reqUrl, method, status, preview_len: preview.length }
    }));
    if (reqUrl.includes('auth.demoLogin')) {
      console.log('proxy:dbg_res_end_preview_auth.demoLogin:\n' + preview);
    }
  } catch(e) {
    console.error('proxy:dbg_res_end_hook_error', e && (e.stack || e));
  }
  return _origResEnd.call(this, chunk, encoding, cb);
};
// --- DEBUG HOOK END ---

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function copyHeaders(srcHeaders) {
  const out = {};
  for (const [k,v] of Object.entries(srcHeaders)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

function safeJSONParse(text){
  try { return JSON.parse(text); } catch(e) { return null; }
}

// --- Proxy: normalize to structured tRPC batch items (path + input) ---
function extractProcPath(url) {
  // Extract procedure path from URL like /api/trpc/auth.demoLogin?batch=1
  let path = url || '';
  // Strip /api/trpc/ prefix if present
  if (path.startsWith('/api/trpc/')) {
    path = path.slice('/api/trpc/'.length);
  } else if (path.startsWith('/api/trpc')) {
    path = path.slice('/api/trpc'.length);
  }
  // Strip query string (everything after ?)
  const qIdx = path.indexOf('?');
  if (qIdx >= 0) {
    path = path.slice(0, qIdx);
  }
  // Remove leading/trailing slashes
  path = path.replace(/^\/+|\/+$/g, '');
  return path || '';
}

function looksLikeKeyedBatchObject(obj){
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  // All values must be objects for a keyed batch (heuristic)
  return keys.every(k => {
    const v = obj[k];
    return v && typeof v === 'object' && !Array.isArray(v);
  });
}

function looksLikeStructuredBatchItem(item) {
  // Check if item already has both 'path' and 'input' fields
  return item && typeof item === 'object' && 'path' in item && 'input' in item;
}

function normalizeBatchBodyToStructured(parsed, procPath) {
  // If already an array of structured items [{path, input}, ...], leave as-is
  if (Array.isArray(parsed)) {
    const allStructured = parsed.every(item => looksLikeStructuredBatchItem(item));
    if (allStructured) {
      return parsed; // Already structured, return as-is
    }
    // Transform each element to {path, input}
    return parsed.map(item => {
      if (looksLikeStructuredBatchItem(item)) {
        return item; // Already structured
      }
      // Plain input object - wrap with path
      return { path: procPath, input: item };
    });
  }
  
  // Keyed-object like { "0": {...}, "1": {...} } -> [{path, input}, ...]
  if (looksLikeKeyedBatchObject(parsed)) {
    const keys = Object.keys(parsed).sort((a, b) => +a - +b); // Numeric sort
    return keys.map(k => {
      const v = parsed[k];
      // If v already has {input}, use it; otherwise wrap v as input
      if (v && typeof v === 'object' && 'input' in v) {
        return { path: procPath, input: v.input };
      }
      return { path: procPath, input: v };
    });
  }
  
  // Single-call object: wrap as single batch item
  if (parsed && typeof parsed === 'object') {
    if ('input' in parsed) {
      return [{ path: procPath, input: parsed.input }];
    }
    // Plain object - wrap as input
    return [{ path: procPath, input: parsed }];
  }
  
  // fallback: return parsed unchanged
  return parsed;
}
// --- end normalization ---

function ensureWireFormatForPayload(payload){
  // Use superjson.serialize to obtain { json, meta }
  const serialized = superjson.serialize(payload);

  // Ensure meta is present (explicit null if missing)
  if (!('meta' in serialized) || serialized.meta === undefined) {
    serialized.meta = null;
  }

  // Construct final wrapper with both keys to be extra-safe
  const finalWire = { json: serialized.json, meta: serialized.meta };

  // Return JSON string for HTTP response
  return JSON.stringify(finalWire);
}

async function proxyRequest(req, res) {
  const url = req.url || '/';
  const method = req.method || 'GET';
  const upstreamUrl = `${UPSTREAM_BASE}${url}`;

  try {
    const rawBody = await readBody(req);
    
    // Normalize request body for POST requests with JSON content-type
    let bodyToSend = rawBody;
    let normalized = null;
    let requestNormalized = false;
    
    if (method !== 'GET' && method !== 'HEAD' && rawBody) {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const parsed = safeJSONParse(rawBody);
        if (parsed !== null) {
          // Extract procedure path from URL
          const procPath = extractProcPath(url);
          
          // Normalize to structured batch format
          normalized = normalizeBatchBodyToStructured(parsed, procPath);
          
          // Check if normalization changed the structure
          requestNormalized = JSON.stringify(parsed) !== JSON.stringify(normalized);
          
          if (normalized && (Array.isArray(normalized) || typeof normalized === 'object')) {
            bodyToSend = JSON.stringify(normalized);
          }
          
          // Detailed logging
          const originalBodyType = Array.isArray(parsed) ? 'array' : typeof parsed;
          const normalizedBodyType = Array.isArray(normalized) ? 'array' : typeof normalized;
          const sampleNormalized = JSON.stringify(normalized).slice(0, 200);
          
          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            'proxy: request_normalized': {
              procPath,
              originalBodyType,
              normalizedBodyType,
              sampleNormalized
            }
          }));
        }
      }
    }
    
    // Build headers for upstream, copy most headers but let fetch set host/connection
    const upstreamHeaders = {};
    for (const [k,v] of Object.entries(req.headers)) {
      // skip hop-by-hop headers or adjust as needed
      if (['host','connection','keep-alive','transfer-encoding'].includes(k)) continue;
      upstreamHeaders[k] = v;
    }
    
    // Set content-type and content-length for normalized body
    if (bodyToSend !== rawBody) {
      upstreamHeaders['content-type'] = 'application/json';
      upstreamHeaders['content-length'] = Buffer.byteLength(bodyToSend).toString();
    }

    // Forward request to upstream
    const fetchOptions = { method, headers: upstreamHeaders };
    if (method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = bodyToSend;
    }

    // Log sending upstream
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      'proxy: sending_upstream': {
        url: upstreamUrl,
        headers: Object.keys(upstreamHeaders),
        bodyLength: bodyToSend ? Buffer.byteLength(bodyToSend) : 0
      }
    }));

    console.log(`proxy:req: ${method} ${url} -> upstream ${upstreamUrl}`);
    const upstreamResp = await fetch(upstreamUrl, fetchOptions);

    const statusCode = upstreamResp.status;
    const upstreamText = await upstreamResp.text();
    const upstreamContentType = upstreamResp.headers.get('content-type') || 'application/json';

    // Default: echo upstream headers (filtered) and body
    const responseHeaders = {};
    upstreamResp.headers.forEach((v,k) => {
      responseHeaders[k] = v;
    });

    // Attempt to parse and transform into superjson wire format if needed
    let transformed = false;
    let finalBody = upstreamText;

    const upstreamBodyParsed = safeJSONParse(upstreamText);
    
    // Debug logging for upstream response parse
    if (upstreamBodyParsed !== null) {
      const upstreamBodyType = Array.isArray(upstreamBodyParsed) ? 'array' : typeof upstreamBodyParsed;
      const upstreamTopKeys = (upstreamBodyParsed && typeof upstreamBodyParsed === 'object' && !Array.isArray(upstreamBodyParsed))
        ? Object.keys(upstreamBodyParsed).slice(0, 5)
        : null;
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        'proxy:dbg upstream bodyType': upstreamBodyType,
        upstreamTopKeys
      }));
    }

    const parsed = upstreamBodyParsed;
    if (parsed !== null) {
      // If it already looks like superjson wire object, keep as-is
      const looksLikeWire = parsed && typeof parsed === 'object' && ('json' in parsed) && ('meta' in parsed);
      if (!looksLikeWire) {
        try {
          // If batch array (tRPC batch), wrap as top-level payload
          if (Array.isArray(parsed)) {
            // tRPC batch: keep array as payload
            finalBody = ensureWireFormatForPayload(parsed);
            transformed = true;
          } else if (parsed && typeof parsed === 'object') {
            // tRPC single entry - often { error: { json: {...} } } or { result: { json: ... } }
            // If it already has error.json or result.json, we should wrap it as batch [parsed]
            if (parsed.error && parsed.error.json) {
              finalBody = ensureWireFormatForPayload([parsed]);
              transformed = true;
            } else if (parsed.result && parsed.result.json) {
              finalBody = ensureWireFormatForPayload([parsed]);
              transformed = true;
            } else if ('json' in parsed && !('meta' in parsed)) {
              // parsed has 'json' but lacks 'meta' (partial serialization); ensure top-level meta
              // We'll treat parsed.json as the payload
              finalBody = ensureWireFormatForPayload(parsed.json);
              transformed = true;
            } else {
              // Generic fallback: serialize the parsed payload into wire format {json:..., meta:...}
              finalBody = ensureWireFormatForPayload(parsed);
              transformed = true;
            }
          }
        } catch (e) {
          console.error('proxy: superjson serialization error', e && e.stack ? e.stack : e);
          transformed = false;
          finalBody = upstreamText; // fallback to original
        }
      } // end not looksLikeWire
    } // end parsed !== null

    // Ensure response headers reflect the final body
    // Remove transfer-encoding header if present and update content-length
    delete responseHeaders['transfer-encoding'];
    responseHeaders['content-type'] = 'application/json; charset=utf-8';
    responseHeaders['content-length'] = Buffer.byteLength(finalBody, 'utf8');

    // DEBUG: After transformation - inspect finalBody type and preview
    try {
      const finalPayload = safeJSONParse(finalBody);
      const finalPayloadType = Array.isArray(finalPayload) ? 'array' : (typeof finalPayload);
      const topKeys = (finalPayload && typeof finalPayload === 'object' && !Array.isArray(finalPayload)) ? Object.keys(finalPayload).slice(0,20) : null;
      console.log(JSON.stringify({ 
        ts: new Date().toISOString(), 
        "proxy:dbg transformDecision": { 
          url: upstreamUrl, 
          status: statusCode, 
          transformed, 
          finalPayloadType: finalPayloadType || typeof finalBody
        } 
      }));
      console.log('proxy:dbg_finalBody_preview:' + finalBody.slice(0,2000));
    } catch(e){ 
      console.error('proxy:dbg_after_transform_error', e && (e.stack||e)); 
    }

    // DEBUG: Inspect finalBody shape before sending
    try {
      const dbgObj = (() => {
        try {
          const parsed = JSON.parse(finalBody);
          if (Array.isArray(parsed)) return { type: 'array', length: parsed.length };
          return { type: 'object', keys: Object.keys(parsed).slice(0,10) };
        } catch(e) { return { type: 'not-json' }; }
      })();
      console.log(`proxy:upstream: ${method} ${url} status=${statusCode} transformed=${transformed} dbg=${JSON.stringify(dbgObj)}`);
    } catch (e) {
      console.error('proxy: debug log failed', e && e.stack ? e.stack : e);
    }
    res.writeHead(statusCode, responseHeaders);
    res.end(finalBody);

    console.log(`proxy:upstream: ${method} ${url} status=${statusCode} transformed=${transformed} keys=${(() => {
      try {
        const obj = JSON.parse(finalBody);
        return Array.isArray(obj) ? ['array'] : Object.keys(obj).slice(0,10);
      } catch(e) { return ['not_json']; }
    })()}`);

  } catch (err) {
    console.error('proxy:error handling request', err && err.stack ? err.stack : err);
    try {
      // Try to respond with 502
      const msg = JSON.stringify({ error: String(err && err.message ? err.message : err) });
      res.writeHead(502, {'content-type':'application/json','content-length': Buffer.byteLength(msg)});
      res.end(msg);
    } catch(e){}
  }
}

const server = http.createServer(proxyRequest);

server.listen(PROXY_PORT, () => {
  console.log(`proxy: listening on http://localhost:${PROXY_PORT} forwarding -> ${UPSTREAM_BASE}`);
});

