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

// --- Proxy: detect keyed httpBatchLink object and normalize to raw array ---
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

function normalizeBatchBodyToRawArray(parsed) {
  // If already an array, convert any {input: ...} items to raw item
  if (Array.isArray(parsed)) {
    return parsed.map(item => {
      if (item && typeof item === 'object' && 'input' in item) return item.input;
      return item;
    });
  }
  // keyed-object like { "0": {...}, "1": {...} } -> [{...}, {...}]
  if (looksLikeKeyedBatchObject(parsed)) {
    const out = Object.keys(parsed).map(k => {
      const v = parsed[k];
      // If v is a tRPC envelope that includes { input: ... }, return v.input
      if (v && typeof v === 'object' && 'input' in v) return v.input;
      // Otherwise return v (the raw object)
      return v;
    });
    return out;
  }
  // Single-call object: if it looks like an envelope { input: ... } -> send raw input
  if (parsed && typeof parsed === 'object') {
    if ('input' in parsed) return [parsed.input];
    // If it already looks like a tRPC call object (has path/method/etc) we might pass as-is,
    // but safer to wrap the raw object in an array for batch-mode upstream
    return [parsed];
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
          normalized = normalizeBatchBodyToRawArray(parsed);
          // Check if normalization changed the structure
          requestNormalized = JSON.stringify(parsed) !== JSON.stringify(normalized);
          
          if (normalized && (Array.isArray(normalized) || typeof normalized === 'object')) {
            bodyToSend = JSON.stringify(normalized);
          }
          
          // Debug logging
          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            'proxy:dbg request_normalized_to_raw_array': {
              url: req.url,
              normalizedIsArray: Array.isArray(normalized),
              normalizedLength: Array.isArray(normalized) ? normalized.length : 0,
              sample: JSON.stringify(Array.isArray(normalized) ? normalized[0] : normalized).slice(0, 200)
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

