#!/usr/bin/env node
// scripts/qa/proxy.mjs - ensure superjson meta present and set content-length
import http from 'http';
import { URL } from 'url';
import superjson from 'superjson';

const argv = process.argv.slice(2);
const kv = {};
for (const a of argv) {
  const [k,v] = a.split('=',2);
  if (v === undefined) continue;
  kv[k.replace(/^--/,'')] = v;
}
const upstream = kv.upstream || 'http://localhost:3012';
const listen = Number(kv.listen || '3007');
const upstreamUrl = new URL(upstream);

function looksLikeTRPCPlainError(p) {
  try {
    if (!p) return false;
    if (Array.isArray(p)) {
      return p.some(i => i && i.error && i.error.json);
    }
    if (typeof p === 'object') {
      if (p.error && p.error.json) return true;
      if (p.json) {
        if (Array.isArray(p.json)) {
          return p.json.some(item => item && item.error && item.error.json);
        }
        if (p.json && p.json.error && p.json.error.json) return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

const server = http.createServer((req, res) => {
  const targetPath = (upstreamUrl.pathname === '/' ? '' : upstreamUrl.pathname) + req.url;
  const options = {
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: { ...req.headers }
  };
  delete options.headers['accept-encoding'];

  const reqChunks = [];
  req.on('data', c => reqChunks.push(c));
  req.on('end', () => {
    const reqBody = Buffer.concat(reqChunks);
    const proxyReq = http.request(options, upstreamRes => {
      // Log diagnostic info for auth.demoLogin requests
      if (req.url && req.url.includes('auth.demoLogin')) {
        console.log('proxy: auth.demoLogin request - upstream headers:', JSON.stringify(upstreamRes.headers));
      }
      
      const chunks = [];
      upstreamRes.on('data', d => chunks.push(d));
      upstreamRes.on('end', () => {
        const bodyBuf = Buffer.concat(chunks);
        const status = upstreamRes.statusCode || 0;
        const contentType = (upstreamRes.headers['content-type'] || '').toLowerCase();

        const forward = (bodyBuffer, extraHeaders = {}) => {
          const headers = { ...upstreamRes.headers, ...extraHeaders };
          delete headers['transfer-encoding'];
          
          // Ensure Set-Cookie headers are forwarded properly
          const cookies = upstreamRes.headers['set-cookie'] || upstreamRes.headers['Set-Cookie'];
          if (cookies) {
            if (req.url && req.url.includes('auth.demoLogin')) {
              console.log('proxy: forwarding Set-Cookie:', Array.isArray(cookies) ? cookies : [cookies]);
            }
            // Ensure cookies is an array for proper forwarding
            if (Array.isArray(cookies)) {
              res.setHeader('Set-Cookie', cookies);
            } else {
              res.setHeader('Set-Cookie', [cookies]);
            }
            // Remove from headers object since we set it explicitly
            delete headers['set-cookie'];
            delete headers['Set-Cookie'];
          }
          
          // set correct content-length
          headers['content-length'] = String(Buffer.byteLength(bodyBuffer));
          // ensure content-type json when needed
          if (!headers['content-type']) headers['content-type'] = 'application/json';
          res.writeHead(status, headers);
          res.end(bodyBuffer);
        };

        if (status >= 400 && contentType.includes('application/json')) {
          let text = '';
          try { text = bodyBuf.toString('utf8'); } catch (e) { text = ''; }
          let parsed;
          try { parsed = JSON.parse(text); } catch (e) { parsed = text; }

          if (looksLikeTRPCPlainError(parsed)) {
            try {
              console.log('proxy: detected tRPC plain error shape; transforming with superjson');

              // If wrapper { json: [...] } exists, serialize the inner array/object
              let toSerialize = parsed;
              if (parsed && typeof parsed === 'object' && parsed.json) {
                toSerialize = parsed.json;
              }

              const serialized = superjson.serialize(toSerialize);
              // Ensure meta key exists (client expects { json: ..., meta: ... })
              if (!Object.prototype.hasOwnProperty.call(serialized, 'meta') || serialized.meta === undefined) {
                serialized.meta = null;
              }
              // Make sure serialized.json exists
              if (!Object.prototype.hasOwnProperty.call(serialized, 'json')) {
                serialized.json = null;
              }

              // Log shape keys for debugging
              console.log('proxy: serialized keys:', Object.keys(serialized));
              const bodyStr = JSON.stringify(serialized);
              const bodyBuffer = Buffer.from(bodyStr, 'utf8');
              return forward(bodyBuffer, { 'content-type': 'application/json' });
            } catch (e) {
              console.error('proxy: superjson.serialize failed', e && (e.stack || e));
              return forward(bodyBuf);
            }
          } else {
            return forward(bodyBuf);
          }
        } else {
          return forward(bodyBuf);
        }
      });
      upstreamRes.on('error', err => {
        console.error('proxy: upstreamRes error', err);
        try { res.writeHead(502); res.end('proxy upstream error'); } catch (e) {}
      });
    });

    proxyReq.on('error', err => {
      if (req.url && req.url.includes('auth.demoLogin')) {
        console.error('proxy: proxyReq error for auth.demoLogin:', err.message, err.code);
      } else {
        console.error('proxy: proxyReq error', err);
      }
      try { res.writeHead(502); res.end('proxy request error'); } catch (e) {}
    });

    if (reqBody && reqBody.length) proxyReq.write(reqBody);
    proxyReq.end();
  });

  req.on('error', err => {
    console.error('proxy: incoming req error', err);
  });
});

server.listen(listen, () => {
  console.log(`QA proxy listening on http://localhost:${listen} -> upstream ${upstream}`);
});
