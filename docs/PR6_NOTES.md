# PR-6: KaAni Flow Package System + Lead-gen Mode

## Summary

This PR adds:
1. **Flow Package System**: JSON-based flow definitions for structured conversations
2. **Lead-gen Mode**: Public (non-authenticated) access to KaAni with session-based tracking
3. **Database Schema**: New `kaani_leads` table for lead tracking
4. **Public Endpoints**: Three new public tRPC endpoints for lead generation
5. **Public UI**: New public-facing KaAni chat interface at `/kaani`

## Files Changed

### New Files
- `server/ai/flows/types.ts` - TypeScript types for flow packages
- `server/ai/flows/flowSchema.ts` - Zod schema for flow package validation
- `server/ai/flows/flowLoader.ts` - Flow package loader with caching
- `server/db_leadgen.ts` - Database helpers for lead-gen functionality
- `server/_core/rateLimiter.ts` - Simple in-memory rate limiting for public endpoints
- `client/src/features/kaani/flows/v1/loan_officer.default.flow.json` - Loan officer flow package
- `client/src/features/kaani/flows/v1/farmer.default.flow.json` - Farmer flow package
- `client/src/pages/KaAniPublic.tsx` - Public KaAni chat UI
- `docs/KAANI_FLOW_PACKAGE_SPEC_v1.md` - Flow package specification
- `drizzle/0009_kaani_leads.sql` - Migration for kaani_leads table

### Modified Files
- `drizzle/schema.ts` - Added `kaaniLeads` table definition
- `drizzle/meta/_journal.json` - Added migration entry for `0009_kaani_leads`
- `server/routers.ts` - Added three public endpoints: `startLeadSession`, `sendLeadMessage`, `captureLead`
- `client/src/App.tsx` - Added public `/kaani` route, moved ERP chat to `/erp/kaani`

## Database Changes

### New Table: `kaani_leads`

Tracks public lead sessions with:
- Session token (64 hex chars, cryptographically secure)
- Conversation and farmer profile linkage
- UTM parameters for marketing attribution
- Contact capture fields (name, email, phone)
- Consent tracking

**Migration**: Run `pnpm drizzle-kit migrate` to apply.

## Public Endpoints

All endpoints are **public** (no authentication required):

1. **`kaani.startLeadSession`**
   - Creates a new lead session with conversation and farmer profile
   - Returns session token for subsequent requests
   - Rate limited: 5 sessions per 10 minutes per IP

2. **`kaani.sendLeadMessage`**
   - Sends message in lead session context
   - Supports flow packages and slot updates
   - Rate limited: 20 requests per 5 minutes per IP
   - Input length guard: max 2,000 characters

3. **`kaani.captureLead`**
   - Captures optional contact information
   - Updates lead record with name/email/phone/consent

## Security & Abuse Prevention

- **Rate Limiting**: In-memory rate limiter (dev-friendly, use Redis in production)
  - Session creation: 5 per 10 minutes per IP
  - Message sending: 20 per 5 minutes per IP
- **Input Validation**: Message length capped at 2,000 characters
- **Safe Logging**: Uses `toSafeErrorSummary` - no session tokens or full messages logged
- **Error Handling**: Graceful fallbacks, never expose internal errors

## Route Changes

- **Public**: `/kaani` → `KaAniPublic` component (no auth required)
- **ERP**: `/erp/kaani` → `KaAniChat` component (authenticated)

Update any internal links to KaAni chat to use `/erp/kaani` instead of `/kaani`.

## Known Limitations

1. **userId for Public Sessions**: Uses `userId=0` as placeholder since `conversations.userId` is NOT NULL. In production, consider:
   - Making `conversations.userId` nullable, OR
   - Creating a system user ID for public sessions

2. **Flow Package Location**: Flow packages are loaded from `client/src/features/kaani/flows/v1/`. In production, copy to server-accessible location or serve via static assets.

3. **Rate Limiting**: Uses in-memory storage. In production, use Redis or a proper rate limiting service for multi-instance deployments.

4. **Flow Navigation**: Step navigation logic (`next` conditions) is defined in schema but not fully implemented in runtime. Current implementation uses first step suggestions.

## Testing

### 1. Run Migrations
```bash
pnpm drizzle-kit migrate
```

### 2. Public Session Creation
- Open `http://localhost:3000/kaani` in browser
- Check browser console/network tab for `startLeadSession` call
- Verify session token is stored in localStorage (`kaani_session_token_v1`)

### 3. Database Verification
```sql
SELECT id, source, audience, session_token, conversation_id, farmer_profile_id, createdAt
FROM kaani_leads
ORDER BY id DESC
LIMIT 1;
```

Expected: `source='public'`, `session_token` non-null, `conversation_id` and `farmer_profile_id` set.

### 4. Message Persistence
Send a message in the UI, then verify:
```sql
SELECT role, LEFT(content,80) AS preview, createdAt
FROM conversation_messages
WHERE conversation_id = (SELECT conversation_id FROM kaani_leads ORDER BY id DESC LIMIT 1)
ORDER BY createdAt DESC
LIMIT 5;
```

Expected: At least 2 rows (user message + assistant reply).

### 5. Slot Update (if implemented in client)
If client sends slots in `sendLeadMessage`, verify farmer profile update:
```sql
SELECT farmer_profile_id, province, cropPrimary, farmSize
FROM farmer_profiles
ORDER BY createdAt DESC
LIMIT 1;
```

### 6. Rate Limit Test
Send more than 20 messages in 5 minutes from same IP, verify graceful 429 error.

## Backward Compatibility

- ✅ All existing endpoints unchanged
- ✅ Existing ERP chat functionality preserved (moved to `/erp/kaani`)
- ✅ Flow packages are optional - system works without them (graceful fallback)
- ✅ No breaking changes to database schema (new table only)

## Next Steps (Future PRs)

- Implement step navigation logic with conditions
- Add flow package admin UI for managing flows
- Export lead data to CRM/marketing tools
- Implement report template generation
- Add analytics dashboard for lead conversion
- Move flow packages to database or CDN
- Implement Redis-based rate limiting



