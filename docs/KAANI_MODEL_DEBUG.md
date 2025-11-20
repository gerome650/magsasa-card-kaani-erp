# KaAni Model Configuration Debug Guide

## Overview

KaAni uses Google's Generative AI (Gemini) for chat responses. The model name is configurable via environment variables.

## Canonical Configuration

The model is configured in `.env`:

```bash
# Gemini model for KaAni (defaults to gemini-1.5-flash if not set)
GOOGLE_AI_STUDIO_MODEL=gemini-1.5-flash
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
```

**Important:** The deprecated `gemini-pro` model is no longer supported. Always use `gemini-1.5-flash` or a newer model.

## How It Works

1. **Backend Entry Point**: `server/_core/index.ts` imports `dotenv/config` at the top, which loads `.env` before any other modules.

2. **Model Configuration**: `server/routers.ts` defines a `getModelName()` function that reads `process.env.GOOGLE_AI_STUDIO_MODEL` with a fallback to `"gemini-1.5-flash"`.

3. **All KaAni Endpoints**: Three endpoints use the model:
   - `kaani.sendMessage` (mutation)
   - `kaani.sendMessageStream` (mutation)
   - `kaani.sendMessageStreamSSE` (subscription)

   Each endpoint calls `getModelName()` at runtime to get the current model name.

## Running in Development

1. **Start the dev server**:
   ```bash
   pnpm dev
   ```

2. **Check bootstrap logs**: When the server starts, you should see:
   ```
   [KaAni] Bootstrapping. GOOGLE_AI_STUDIO_MODEL = gemini-1.5-flash
   [KaAni] Final MODEL_NAME = gemini-1.5-flash
   ```

3. **Test KaAni**:
   - Open http://localhost:3000/kaani in your browser
   - Send a message
   - Check the server logs for:
     ```
     [KaAni] Using Google model: gemini-1.5-flash NODE_ENV: development
     ```

## Verification Checklist

✅ **No `gemini-pro` references**: Run `grep -r "gemini-pro"` in the repo (excluding node_modules) - should return 0 matches.

✅ **Bootstrap logs show correct model**: Server startup logs should show `gemini-1.5-flash` (or your configured model).

✅ **Runtime logs show correct model**: Each KaAni request should log the model name being used.

✅ **No 404 errors**: The API should not return 404 errors about `models/gemini-pro` not being found.

✅ **Error detection**: If `gemini-pro` is detected at startup, an error will be logged:
   ```
   [KaAni] ERROR: Detected gemini-pro model! This is deprecated. Please set GOOGLE_AI_STUDIO_MODEL=gemini-1.5-flash in .env
   ```

## Troubleshooting

### Issue: Still seeing `gemini-pro` in errors

**Solution:**
1. Verify `.env` has `GOOGLE_AI_STUDIO_MODEL=gemini-1.5-flash` (not `gemini-pro`)
2. Check for multiple `.env` files (`.env.bak`, `.env.save`) that might override the main `.env`
3. **Restart the dev server** - environment variables are loaded at startup
4. Check server logs for bootstrap messages to confirm the model being used

### Issue: Model name not updating after changing `.env`

**Solution:**
- The `getModelName()` function reads `process.env` at runtime, but Node.js caches environment variables.
- **You must restart the dev server** after changing `.env` for changes to take effect.

### Issue: Bootstrap logs show wrong model

**Solution:**
1. Check that `.env` is in the correct location (repo root: `magsasa-card-kaani-erp/.env`)
2. Verify `server/_core/index.ts` has `import "dotenv/config"` at the top
3. Check for typos in the env var name: `GOOGLE_AI_STUDIO_MODEL` (not `GOOGLE_AI_MODEL` or similar)

## Code Locations

- **Model configuration**: `server/routers.ts` (lines 12-27)
- **Backend entry point**: `server/_core/index.ts` (line 1: `import "dotenv/config"`)
- **Environment file**: `.env` (repo root)

## Related Files

- `server/routers.ts` - KaAni router with all three endpoints
- `server/_core/index.ts` - Server entry point that loads environment variables
- `.env` - Environment configuration file

