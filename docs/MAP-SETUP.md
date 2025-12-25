# Farm Map View Setup Guide

This guide explains how to configure Google Maps for the Farm Map View (`/map` route).

## Overview

The Farm Map View uses Google Maps JavaScript API via a Forge proxy. It requires:
- `VITE_FRONTEND_FORGE_API_KEY` environment variable
- Google Cloud project with Maps JavaScript API enabled
- Proper API key restrictions configured

## Environment Configuration

### Local Development

1. **Create `.env.local` in project root:**
   ```bash
   VITE_FRONTEND_FORGE_API_KEY=your_forge_api_key_here
   ```

2. **Never commit `.env.local`** - it's git-ignored for security.

3. **Restart dev server** after adding the key:
   ```bash
   pnpm dev
   ```

### Production

Set `VITE_FRONTEND_FORGE_API_KEY` in your production environment (e.g., via deployment platform env vars).

## Google Cloud Console Configuration

### Step 1: Enable Maps JavaScript API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Maps JavaScript API"
5. Click **Enable**

### Step 2: Create API Key

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated key (this is your `VITE_FRONTEND_FORGE_API_KEY`)

### Step 3: Configure API Key Restrictions

**Important:** Restrict your API key to prevent unauthorized usage.

1. Click on your newly created API key to edit it
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add allowed referrers:

   **For local development:**
   ```
   http://localhost:3000/*
   http://localhost:5173/*
   http://127.0.0.1:3000/*
   http://127.0.0.1:5173/*
   ```

   **For production:**
   ```
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```

4. Under **API restrictions**, select **Restrict key**
5. Check only **Maps JavaScript API** (or leave unrestricted if using multiple Google APIs)
6. Click **Save**

## Troubleshooting

### Blank Map / Map Not Loading

If the map shows a blank white area:

1. **Check browser console** for `[MapView][DEV]` logs:
   - Look for error messages
   - Check for diagnostic hints (e.g., "ApiNotActivatedMapError", "RefererNotAllowedMapError")

2. **Common Issues:**

   **"ApiNotActivatedMapError"**
   - **Fix:** Enable "Maps JavaScript API" in Google Cloud Console
   - Go to APIs & Services → Library → search "Maps JavaScript API" → Enable

   **"RefererNotAllowedMapError"**
   - **Fix:** Add your domain/URL to HTTP referrer restrictions
   - Go to APIs & Services → Credentials → Edit your API key
   - Under "Application restrictions", add your referrer patterns (see Step 3 above)

   **"InvalidKeyMapError"**
   - **Fix:** Verify `VITE_FRONTEND_FORGE_API_KEY` is correct
   - Check `.env.local` (dev) or production env vars
   - Ensure the key hasn't been deleted or regenerated

   **"QuotaExceededError"**
   - **Fix:** Check Maps JavaScript API usage in Google Cloud Console
   - Upgrade billing plan or wait for quota reset

3. **In Development Mode:**
   - The map area will show a yellow warning box with error details
   - Console logs include diagnostic hints
   - Check for `[FarmMapView][DEV]` logs for additional context

4. **In Production:**
   - Users see a generic "Map temporarily unavailable" message
   - Check server logs and Google Cloud Console for quota/usage issues

### Missing Token Banner

If you see a yellow banner saying "Map token missing":
- Add `VITE_FRONTEND_FORGE_API_KEY` to `.env.local` (dev) or production env
- Restart the dev server after adding the key

### Map Loads But No Markers

- Check that farm data has valid coordinates (`latitude`, `longitude` not null/zero)
- Check browser console for `[FarmMapView][DEV]` logs showing data counts
- Verify `trpc.farms.mapList` is returning data

## Security Best Practices

1. **Never commit API keys to git**
   - Use `.env.local` for local dev (git-ignored)
   - Use secure env var management in production

2. **Always restrict API keys**
   - Use HTTP referrer restrictions
   - Limit to specific APIs (Maps JavaScript API only)

3. **Monitor usage**
   - Set up billing alerts in Google Cloud Console
   - Review API usage regularly

4. **Rotate keys if compromised**
   - Regenerate API key if exposed
   - Update all environments with new key

## Testing

After configuration:

1. **Start dev server:** `pnpm dev`
2. **Navigate to:** `http://localhost:3000/map` (or your dev port)
3. **Verify:**
   - Map tiles load (not blank)
   - Farm markers appear on map
   - No error banners or warnings
   - Console shows `[MapView][DEV] Google Maps script loaded successfully`

## Related Documentation

- `docs/ENV-REQUIREMENTS-BATCH-ORDERS.md` - Environment variable reference
- `docs/LOCAL-QA-CHECKLIST-BATCH-ORDERS.md` - Local testing checklist

