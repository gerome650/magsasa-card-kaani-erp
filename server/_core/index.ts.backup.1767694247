import "dotenv/config";
import { Buffer } from "buffer";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// superjson transformer removed - not supported in current tRPC version

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();

// --- BEGIN: tRPC body handling change -----------------
// Create JSON/urlencoded parser instances and only apply them for non-tRPC routes.
// This allows tRPC's HTTP adapter to read the raw request stream for /api/trpc.
const jsonParser = express.json({
  type: ["application/json", "application/trpc+json"],
  verify: (req: any, _res: any, buf: Buffer) => {
    try {
      (req as any).rawBody = buf && buf.length ? buf.toString("utf8") : "";
    } catch (e) {
      (req as any).rawBody = "";
    }
  }
});

// urlencoded parser for non-tRPC endpoints
const urlencodedParser = express.urlencoded({
  extended: true,
  type: ["application/x-www-form-urlencoded", "application/trpc+json"]
});

// Apply parsers only to non-trpc routes. This avoids consuming the raw stream for /api/trpc.
// If req.path starts with /api/trpc, skip these parsers and let tRPC handle body parsing.
app.use((req: any, res: any, next: any) => {
  if (req && (req.path || req.url) && String(req.path || req.url).startsWith('/api/trpc')) {
    return next();
  }
  // run json parser
  return jsonParser(req, res, () => {
    // then urlencoded parser if needed (safe to call; it will detect content-type)
    return urlencodedParser(req, res, next);
  });
});
// --- END: tRPC body handling change -------------------


  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  // replaced: express.json() moved to conditional non-tRPC parser;
  // replaced: express.urlencoded() moved to conditional non-tRPC parser;
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Debug request body for tRPC (enabled when DEBUG_TRPC_REQ=true)
  if (process.env.DEBUG_TRPC_REQ === 'true') {
    // Ensure express.json() runs earlier in the file (it probably does already)
    



// --- TRPC PRE-MIDDLEWARE DIAGNOSTIC WRAPPER (inserted by debug script) ---
try {
  // capture the original middleware call result into a variable
  const __trpc_mw_creator = (function() {
    // replicate the original call expression by returning the created middleware function
    return (req, res, next) => {
      try {
        const preview = (() => {
          try {
            if (typeof req.body === 'object') return JSON.stringify(req.body).slice(0, 2000);
            return String(req.body).slice(0, 2000);
          } catch (e) { return '<unserializable body>'; }
        })();
        console.log(JSON.stringify({
          tag: 'server:dbg:reqBody',
          ts: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl || req.url,
          contentType: req.headers['content-type'],
          bodyPreview: preview
        }));
      } catch (err) {
        console.log('server:dbg:reqBody:error', String(err));
      }
      next();
    };
  })();
  // create wrapped middleware
  const __trpc_wrapped_mw = function (req: any, res: any, next: any) {
    try {
      const ts = new Date().toISOString();
      let bodyType = typeof (req && req.body);
      let rawPreview = null;
      try {
        if (typeof req.body !== 'undefined') {
          if (typeof req.body === 'string') rawPreview = req.body.slice(0,300);
          else try { rawPreview = JSON.stringify(req.body).slice(0,300); } catch(e) { rawPreview = String(req.body).slice(0,300); }
        }
      } catch(e){ }
      // log minimal diagnostics as JSON to stdout
      console.log(JSON.stringify({
        tag: "server:pre-trpc",
        ts: ts,
        url: req && (req.originalUrl || req.url),
        method: req && req.method,
        hasBodyProp: ("body" in (req || {})),
        bodyType: bodyType,
        bodyPreview: rawPreview,
        _body_flag: !!(req && req._body),
        readable: !!(req && req.readable),
        readableEnded: !!(req && req.readableEnded),
        headers: {
          "content-type": (req && req.headers && (req.headers['content-type']||req.headers['Content-Type'])) || null,
          "content-length": (req && req.headers && (req.headers['content-length']||req.headers['Content-Length'])) || null
        }
      }));
    } catch (e) {
      console.error("server:pre-trpc:error", e && (e.stack||e.message||String(e)));
    }
    // call the real tRPC middleware
    try {
      return __trpc_mw_creator(req, res, next);
    } catch(e) {
      // if middleware returns a Promise, ensure errors are forwarded
      try {
        const rtn = __trpc_mw_creator(req, res, next);
        if (rtn && typeof rtn.then === 'function') rtn.catch(next);
        return rtn;
      } catch (err) { next(err); }
    }
  };
  // register wrapper
  
// --- TRPC PRE-MIDDLEWARE DIAGNOSTIC & BODY-ENSURE WRAPPER (injected) ---
try {
  // Create the original middleware function once
  const __trpc_middleware_factory = (() => {
    return __trpc_wrapped_mw;
  })();

  const __trpc_mw = __trpc_middleware_factory;

  function __ensure_body_and_call_trpc(req, res, next) {
    try {
      // If req.body already present, just proceed
      if (Object.prototype.hasOwnProperty.call(req, 'body') && typeof req.body !== 'undefined') {
        // log diagnostic
        try {
          console.log(JSON.stringify({
            tag: "server:pre-trpc",
            ts: new Date().toISOString(),
            url: req && (req.originalUrl || req.url),
            method: req && req.method,
            hasBodyProp: true,
            bodyType: typeof req.body,
            bodyPreview: (typeof req.body === 'string') ? req.body.slice(0,300) : (function(){
              try { return JSON.stringify(req.body).slice(0,300); } catch(e) { return String(req.body).slice(0,300); }
            })(),
            _body_flag: !!req._body,
            readable: !!req.readable,
            readableEnded: !!req.readableEnded,
            headers: {
              "content-type": (req && req.headers && (req.headers['content-type']||req.headers['Content-Type']))||null,
              "content-length": (req && req.headers && (req.headers['content-length']||req.headers['Content-Length']))||null
            }
          }));
        } catch(e){ console.error('server:pre-trpc:diag:error', e && (e.stack||e.message||String(e))); }
        return __trpc_mw(req, res, next);
      }

      // Only buffer for methods that have bodies
      if (!req.method || !['POST','PUT','PATCH','DELETE'].includes((req.method||'').toUpperCase())) {
        // log minimal diag
        try {
          console.log(JSON.stringify({
            tag: "server:pre-trpc",
            ts: new Date().toISOString(),
            url: req && (req.originalUrl || req.url),
            method: req && req.method,
            hasBodyProp: false,
            note: "no buffering for method"
          }));
        } catch(e){ }
        return __trpc_mw(req, res, next);
      }

      // Read the raw body synchronously by attaching listeners; buffer it fully, set req.body as string/object
      let raw = '';
      // set encoding so data chunks are strings
      if (typeof req.setEncoding === 'function') req.setEncoding('utf8');

      let handled = false;
      function done(err) {
        if (handled) return;
        handled = true;
        if (err) return next(err);
        try {
          // Try to parse JSON, but keep the string too
          let parsed;
          try { parsed = JSON.parse(raw); } catch(e) { parsed = raw; }
          // Prefer string form for tRPC (createBody checks typeof req.body === 'string' first),
          // but set both to be safe.
          req.rawBody = raw;
          // Also set both string and object: set string to be used by createBody, and store object in req.bodyIfObject
          req.body = (typeof raw === 'string') ? raw : raw;
          // Also set an object variant for safety
          req._body = true;
          // set parsed object in case tRPC expects object property
          try { req.body_parsed = parsed; } catch(e){/* ignore */}
        } catch(e) {
          // ignore
        }
        try {
          console.log(JSON.stringify({
            tag: "server:pre-trpc",
            ts: new Date().toISOString(),
            url: req && (req.originalUrl || req.url),
            method: req && req.method,
            hasBodyProp: Object.prototype.hasOwnProperty.call(req,'body'),
            bodyType: typeof req.body,
            bodyPreview: (typeof req.body === 'string') ? req.body.slice(0,300) : String(req.body).slice(0,300),
            _body_flag: !!req._body,
            readable: !!req.readable,
            readableEnded: !!req.readableEnded
          }));
        } catch(e){ }
        try {
          return __trpc_mw(req, res, next);
        } catch(e) {
          try {
            const r = __trpc_mw(req, res, next);
            if (r && typeof r.then === 'function') r.catch(next);
            return r;
          } catch(err) { next(err); }
        }
      }

      req.on && req.on('data', chunk => raw += chunk);
      req.on && req.on('end', () => done());
      req.on && req.on('error', err => done(err));

      // If node has already ended the stream, schedule done
      if (req.readableEnded === true || req.complete === true) {
        // If no data events fired, raw could be empty; still call done
        setImmediate(() => done());
      }
    } catch(e) {
      console.error('server:pre-trpc:wrapper:exception', e && (e.stack||e.message||String(e)));
      next(e);
    }
  }

  // Register wrapper and ensure original is not left behind
  
/**
 * Pre-tRPC middleware: reads raw JSON body for /api/trpc requests,
 * sets req.body (object or string) before tRPC's createBody runs.
 * Logs minimal diagnostics for debug.
 */
app.use('/api/trpc', (req, res, next) => {
  try {
    console.log('server:pre-trpc: enter', { url: req.url, method: req.method });

    // If body already present and not undefined, skip (but log)
    if ('body' in req && req.body !== undefined) {
      console.log('server:pre-trpc: req.body already present (skipping)', { url: req.url, type: typeof req.body });
      return next();
    }

    const method = (req.method || '').toUpperCase();
    const ct = (req.headers['content-type'] || '').toLowerCase();

    // If not a JSON body POST/PUT/PATCH, still ensure 'body' prop exists
    if (method === 'GET' || !ct.includes('application/json')) {
      if (!('body' in req)) (req as any).body = undefined;
      console.log('server:pre-trpc: not-json-or-get, body set undefined', { url: req.url, method, contentType: ct });
      return next();
    }

    // Collect chunks synchronously
    const chunks: Buffer[] = [];
    let gotData = false;
    req.on('data', (chunk: Buffer) => {
      gotData = true;
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => {
      const rawBuf = Buffer.concat(chunks);
      const rawStr = rawBuf.toString('utf8');
      if (rawStr.length === 0) {
        (req as any).body = undefined;
        console.log('server:pre-trpc: end(empty) -> body undefined', { url: req.url });
        return next();
      }
      try {
        const parsed = JSON.parse(rawStr);
        (req as any).body = parsed;
        console.log('server:pre-trpc: body_set', {
          url: req.url,
          raw_len: rawBuf.length,
          body_type: typeof parsed,
          preview: (typeof parsed === 'string') ? parsed.slice(0,200) : JSON.stringify(parsed).slice(0,200)
        });
      } catch (err) {
        // If JSON parse fails, keep raw string
        (req as any).body = rawStr;
        console.log('server:pre-trpc: body_set_string', { url: req.url, raw_len: rawBuf.length, preview: rawStr.slice(0,200) });
      }
      return next();
    });

    req.on('error', (err) => {
      console.error('server:pre-trpc: request stream error', err);
      (req as any).body = undefined;
      next();
    });

    // Safety timeout: if no events fire, ensure body prop exists
    setTimeout(() => {
      if (!('body' in req)) {
        (req as any).body = undefined;
        console.log('server:pre-trpc: timeout set body undefined', { url: req.url });
        next();
      }
    }, 250);
  } catch (e) {
    console.error('server:pre-trpc: unexpected error', e);
    (req as any).body = undefined;
    next();
  }
});

app.use('/api/trpc', __ensure_body_and_call_trpc);
} catch (e) {
  console.error('server:pre-trpc:top:error', e && (e.stack||e.message||String(e)));
}
// --- END OF INJECTED WRAPPER ---

} catch (err_wrapper) {
  console.error("server:pre-trpc:wrapper:error", err_wrapper && (err_wrapper.stack||err_wrapper.message||String(err_wrapper)));
}
// --- end wrapper ---

  }
  
  


// --- BEGIN: trpc raw-body capture middleware (fix/trpc-body-early-set) ---
/**
 * This middleware fully reads the incoming request stream (async)
 * and sets req.rawBody and req.body before calling next(), ensuring
 * tRPC's adapter can read req.body synchronously from the Express request.
 *
 * Uses async iteration `for await (const chunk of req)` to collect chunks.
 */
app.use("/api/trpc", async (req: any, res: any, next: any) => {
  try {
    if (req.method !== "POST") return next();

    // If already parsed, pass through
    if (typeof req.body !== "undefined") {
      return next();
    }

    // If stream already ended or not readable, continue.
    if (req.readableEnded || !req.readable) {
      return next();
    }

    // Collect raw body via async iterator (safe and avoids adding regular 'data' listeners)
    let raw = "";
    // If request encoding not set, try to set UTF-8 (we expect JSON mostly)
    if (typeof req.setEncoding === "function") {
      try { req.setEncoding("utf8"); } catch (_e) {}
    }

    // Use a timeout guard to avoid hanging forever
    const TIMEOUT_MS = 5000;
    let timedOut = false;
    const to = setTimeout(() => { timedOut = true; }, TIMEOUT_MS);

    try {
      for await (const chunk of req) {
        if (timedOut) break;
        raw += chunk;
      }
    } catch (err) {
      // If reading fails, log and continue to next middleware.
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({
        tag: "server:dbg:reqBody_read_error",
        ts: new Date().toISOString(),
        err: (err && (err.stack || err.message || String(err))) || String(err)
      }));
    } finally {
      clearTimeout(to);
    }

    // Attach raw body and parsed body (if JSON) so tRPC's incomingMessageToRequest can use it
    req.rawBody = raw;
    try {
      req.body = raw === "" ? undefined : JSON.parse(raw);
    } catch (e) {
      // Not JSON — keep raw string
      req.body = raw;
    }
    // Mark as parsed so other body parsers skip
    req._body = true;

    // Debug log for verification
    try {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        tag: "server:dbg:reqBody_set2",
        ts: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        raw_len: (req.rawBody || "").length,
        body_preview: ((req.rawBody || "").slice(0,200)),
        body_type: typeof req.body
      }));
    } catch (_) {}

    return next();
  } catch (err) {
    // If anything unexpected happens, log and continue
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({
      tag: "server:dbg:reqBody_unexpected",
      ts: new Date().toISOString(),
      err: (err && (err.stack || err.message || String(err))) || String(err)
    }));
    // Ensure req.body remains undefined to allow fallback behavior
    req.body = undefined;
    req._body = false;
    return next();
  }
});
// --- END: trpc raw-body capture middleware (fix/trpc-body-early-set) ---


// tRPC API
  app.use(
    "/api/trpc",
    
  createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
