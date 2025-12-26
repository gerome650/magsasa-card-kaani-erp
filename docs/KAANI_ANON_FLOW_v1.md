# KaAni Anonymous-First Flow v1

**Purpose:** Document the anonymous-first workflow for KaAni conversations and recommendations (PR-2 implementation).

## Overview

KaAni conversations operate on anonymous `farmer_profile_id` (UUIDv4) end-to-end, enabling recommendations without requiring farmer identity or PII. This supports BSP-friendly pseudonymous workflows.

## Flow Description

### 1. Conversation Creation → Farmer Profile Binding

When a conversation is created:
- A new `farmer_profiles` row is automatically created with a UUIDv4
- The `farmer_profile_id` is bound to the `conversations.farmer_profile_id` field
- `created_by_user_id` is set to the current user (if available)
- No farmer name or PII is required

**Implementation:**
- `createConversation()` in `server/db.ts` automatically creates a farmer profile
- `conversations.create` tRPC endpoint creates conversation with bound profile

### 2. Progressive Profile Updates

As conversation context is collected, the farmer profile can be updated with:
- Location data (province, municipality, barangay)
- Crop information (crop_primary)
- Agronomic data (average_yield, soil_type, irrigation_type, farm_size)
- Economic data (inputs, prices as JSON)
- Additional context (stored in JSON)

**Implementation:**
- `updateFarmerProfile()` in `server/db.ts` updates profile fields
- Only provided fields are updated (does not overwrite with null)

### 3. Recommendation Persistence

When a recommendation is generated:
- It is saved to `kaani_recommendations` table
- Linked to the conversation's `farmer_profile_id`
- Stores recommendation text, type, and status

**Implementation:**
- `kaani.saveRecommendation` tRPC endpoint saves recommendations
- Automatically ensures conversation has a farmer_profile_id before saving

## API Endpoints

### `conversations.create`
- **Input:** `{ title: string }`
- **Output:** `{ conversationId: number }`
- **Behavior:** Automatically creates and binds farmer_profile_id

### `conversations.ensureFarmerProfile`
- **Input:** `{ conversationId: number }`
- **Output:** `{ farmerProfileId: string }`
- **Behavior:** Ensures conversation has a farmer_profile_id (creates if missing)

### `kaani.saveRecommendation`
- **Input:** `{ conversationId: number, recommendationText: string, recommendationType?: string, status?: string }`
- **Output:** `{ recommendationId: number, farmerProfileId: string }`
- **Behavior:** Saves recommendation linked to conversation's farmer_profile_id

## Database Functions

### `ensureFarmerProfileForConversation(conversationId, createdByUserId?)`
- Checks if conversation has farmer_profile_id
- Creates new profile with UUIDv4 if missing
- Updates conversation with farmer_profile_id
- Returns the farmer_profile_id

### `updateFarmerProfile(farmerProfileId, updates)`
- Updates farmer profile with provided fields
- Only updates fields that are explicitly provided
- Fields: province, municipality, barangay, cropPrimary, averageYield, soilType, irrigationType, farmSize, inputs, prices, additionalContext

### `saveRecommendation(data)`
- Saves recommendation to kaani_recommendations table
- Requires farmerProfileId, recommendationText
- Optional: recommendationType, status

## Testing / Verification

### Manual Testing Steps

1. **Create Conversation → Verify Profile Binding:**
   ```
   1. Open KaAni Chat page
   2. Start a new conversation (type a message)
   3. Verify in database:
      - conversations table has a new row with farmer_profile_id set
      - farmer_profiles table has a corresponding row with the same UUID
   ```

2. **Generate Recommendation → Verify Persistence:**
   ```
   1. Continue conversation and ask for a recommendation
   2. Call kaani.saveRecommendation endpoint (or implement automatic detection)
   3. Verify in database:
      - kaani_recommendations table has a new row
      - farmer_profile_id matches the conversation's profile
      - recommendationText contains the recommendation content
   ```

### Database Queries for Verification

```sql
-- Check conversation with profile binding
SELECT c.id, c.title, c.farmer_profile_id, fp.created_by_user_id, fp.created_at
FROM conversations c
LEFT JOIN farmer_profiles fp ON c.farmer_profile_id = fp.farmer_profile_id
ORDER BY c.created_at DESC
LIMIT 5;

-- Check recommendations
SELECT kr.id, kr.farmer_profile_id, kr.recommendation_type, kr.status, kr.created_at,
       LEFT(kr.recommendation_text, 100) as preview
FROM kaani_recommendations kr
ORDER BY kr.created_at DESC
LIMIT 5;

-- Check profile updates
SELECT farmer_profile_id, province, municipality, barangay, crop_primary,
       created_at, updated_at
FROM farmer_profiles
ORDER BY updated_at DESC
LIMIT 5;
```

## Notes

- All farmer profiles are anonymous (no PII required)
- Identity linking (via `identity_links` table) is Phase 3, not implemented in PR-2
- Profile updates are progressive (fields added as context is collected)
- Recommendations are tied to profiles, not user identities
- This enables BSP-friendly pseudonymous workflows

