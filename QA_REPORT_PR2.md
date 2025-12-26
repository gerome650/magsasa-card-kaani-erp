# PR-2 QA Review Report: KaAni Anonymous-First Flow

**Review Date:** Current  
**Reviewer:** QA/Reviewer  
**PR Scope:** Conversation → farmer_profile_id binding, ensureFarmerProfile endpoint, saveRecommendation persistence

---

## A) Findings

- ✅ **[PASS] Schema Alignment**
  - `farmer_profiles.farmerProfileId` (PK) correctly maps to `farmer_profile_id` CHAR(36)
  - `conversations.farmerProfileId` correctly maps to `farmer_profile_id` (nullable)
  - `kaani_recommendations` columns match code usage:
    - `farmerProfileId` → `farmer_profile_id` ✅ (explicit mapping in schema)
    - `recommendationText` → `recommendationText` ✅ (camelCase, no explicit mapping)
    - `recommendationType` → `recommendationType` ✅ (camelCase, no explicit mapping)
    - `status` → `status` ✅
  - Note: DB uses camelCase for recommendation columns (matches migration), which is unusual but consistent

- ⚠️ **[WARN] Transaction Safety**
  - `createConversation()` is NOT atomic: creates farmer_profile first, then inserts conversation
  - `ensureFarmerProfileForConversation()` is NOT atomic: creates profile, then updates conversation
  - **Failure mode:** If conversation insert/update fails after profile creation, orphaned farmer_profile row remains
  - **Impact:** Low-medium - orphaned profiles don't break functionality, but waste storage and create inconsistency
  - **Note:** Codebase pattern (see CSV upload docs) intentionally uses non-transactional operations for better error granularity
  - **Recommendation:** Acceptable for now, but consider adding transaction wrapper for production hardening

- ✅ **[PASS] ensureFarmerProfile Endpoint Wiring**
  - Endpoint correctly defined at `conversations.ensureFarmerProfile`
  - Properly calls `db.ensureFarmerProfileForConversation()`
  - Returns `{ farmerProfileId: string }`
  - Protected procedure (requires authentication)

- ✅ **[PASS] saveRecommendation Persistence**
  - Endpoint correctly defined at `kaani.saveRecommendation`
  - Automatically ensures farmer_profile_id before saving
  - Correctly inserts into `kaani_recommendations` with all required fields
  - Returns `{ recommendationId, farmerProfileId }`
  - Protected procedure (requires authentication)

- ✅ **[PASS] Security/Compliance**
  - No PII in farmer_profiles (anonymous-first design maintained)
  - No sensitive values in logs (error handling uses safe patterns)
  - Protected endpoints require authentication
  - UUIDv4 used for farmer_profile_id (non-sequential, non-guessable)

---

## B) Commands to Run (Copy/Paste Blocks)

### 1. Terminal Commands

```bash
# Start dev server (if not already running)
pnpm dev
```

**Note:** If dev server is already running, no need to restart.

### 2. UI Verification: Create Conversation → Verify Profile Binding

1. Open browser to KaAni Chat page (usually `/kaani` or similar route)
2. Type a message in the chat input (e.g., "Hello KaAni")
3. This automatically triggers `conversations.create` which creates conversation + farmer_profile

### 3. MySQL Verification SQL

```sql
-- Connect to MySQL
mysql -u <user> -p <database_name>

-- 1. Verify latest conversation has farmer_profile_id
SELECT 
    c.id AS conversation_id,
    c.title,
    c.farmer_profile_id,
    c.created_at,
    fp.created_by_user_id,
    fp.created_at AS profile_created_at
FROM conversations c
LEFT JOIN farmer_profiles fp ON c.farmer_profile_id = fp.farmer_profile_id
WHERE c.user_id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1)
ORDER BY c.created_at DESC
LIMIT 1;

-- Expected: Should show conversation with non-null farmer_profile_id and matching farmer_profiles row

-- 2. Verify farmer_profiles row exists
SELECT 
    farmer_profile_id,
    created_by_user_id,
    province,
    municipality,
    barangay,
    crop_primary,
    created_at
FROM farmer_profiles
WHERE farmer_profile_id = (
    SELECT farmer_profile_id 
    FROM conversations 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Expected: Should return exactly one row with UUID farmer_profile_id
```

### 4. Recommendation Persistence Test

#### Option A: Using tRPC Client (if you have access to browser console)

1. Open browser console on KaAni Chat page
2. Get conversation ID from previous test
3. Run this JavaScript:

```javascript
// Assuming trpcClient is available (check your client setup)
const conversationId = 123; // Replace with actual conversation ID from step 3

await trpcClient.kaani.saveRecommendation.mutate({
  conversationId: conversationId,
  recommendationText: "Test recommendation: Apply organic fertilizer at 2 bags per hectare during planting season.",
  recommendationType: "fertilizer",
  status: "active"
});
```

#### Option B: Using Node Script (Recommended)

Create `test-save-recommendation.mjs`:

```javascript
import mysql from 'mysql2/promise';
import 'dotenvx/config';

async function testSaveRecommendation() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    return;
  }
  
  // Parse connection string
  const url = new URL(connectionString.replace('mysql://', 'http://'));
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || 3306;
  const database = url.pathname.slice(1);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
    });
    
    // Get latest conversation ID
    const [conversations] = await connection.execute(
      "SELECT id, farmer_profile_id FROM conversations ORDER BY created_at DESC LIMIT 1"
    );
    
    if (conversations.length === 0) {
      console.log("No conversations found. Please create a conversation first.");
      return;
    }
    
    const conversationId = conversations[0].id;
    const farmerProfileId = conversations[0].farmer_profile_id;
    
    if (!farmerProfileId) {
      console.log("Conversation has no farmer_profile_id. This should not happen if PR-2 is working.");
      return;
    }
    
    console.log(`Using conversation ID: ${conversationId}`);
    console.log(`Farmer Profile ID: ${farmerProfileId}`);
    
    // Note: This script only verifies the DB state
    // To actually test the endpoint, use Option A or call the API directly
    console.log("\nTo test the endpoint, use one of these methods:");
    console.log("1. Browser console with trpcClient (see Option A)");
    console.log("2. curl/HTTP request to tRPC endpoint");
    console.log("3. Manual SQL insert for verification:");
    
    console.log(`\n-- Manual SQL to insert test recommendation:`);
    console.log(`INSERT INTO kaani_recommendations (farmer_profile_id, recommendationText, recommendationType, status)`);
    console.log(`VALUES ('${farmerProfileId}', 'Test recommendation: Apply organic fertilizer', 'fertilizer', 'active');`);
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testSaveRecommendation();
```

Run it:
```bash
node test-save-recommendation.mjs
```

#### Option C: Direct SQL Insert (Quick Verification)

```sql
-- Get a conversation's farmer_profile_id first
SELECT id, farmer_profile_id FROM conversations ORDER BY created_at DESC LIMIT 1;

-- Then insert test recommendation (replace <farmer_profile_id> with actual UUID)
INSERT INTO kaani_recommendations (
    farmer_profile_id, 
    recommendationText, 
    recommendationType, 
    status
) VALUES (
    '<farmer_profile_id>',  -- Replace with actual UUID from above
    'Test recommendation: Apply organic fertilizer at 2 bags per hectare.',
    'fertilizer',
    'active'
);
```

### 5. Verify Recommendation Was Saved

```sql
-- Check latest recommendation
SELECT 
    kr.id,
    kr.farmer_profile_id,
    kr.recommendationType,
    kr.status,
    LEFT(kr.recommendationText, 100) AS preview,
    kr.createdAt,
    c.id AS conversation_id,
    c.title AS conversation_title
FROM kaani_recommendations kr
LEFT JOIN conversations c ON kr.farmer_profile_id = c.farmer_profile_id
ORDER BY kr.createdAt DESC
LIMIT 1;

-- Expected: Should show recommendation row with matching farmer_profile_id
```

---

## C) Minimal Patch (ONLY if needed)

**Status:** ⚠️ **Optional Enhancement** (not blocking)

### Transaction Safety Enhancement

**File:** `server/db.ts`

**Issue:** `createConversation()` and `ensureFarmerProfileForConversation()` are not atomic.

**Minimal Fix (if desired):**

Wrap operations in Drizzle transaction. Drizzle supports transactions via `db.transaction()`:

```typescript
// In createConversation(), replace lines 684-696 with:
const finalFarmerProfileId = data.farmerProfileId || randomUUID();

await db.transaction(async (tx) => {
  // Insert farmer profile
  await tx.insert(farmerProfiles).values({
    farmerProfileId: finalFarmerProfileId,
    createdByUserId: data.userId,
  });
  
  // Insert conversation
  const result = await tx.insert(conversations).values({
    userId: data.userId,
    title: data.title,
    farmerProfileId: finalFarmerProfileId,
  });
  
  return Number(result[0].insertId);
});
```

**Note:** This is a codebase pattern decision. Current implementation follows the intentional non-transactional pattern used elsewhere (CSV uploads). Recommend documenting this trade-off rather than changing unless there's a specific production concern.

---

## D) Merge Verdict

**✅ SAFE TO MERGE**

**Reasoning:**
- ✅ Schema alignment is correct
- ✅ Endpoints are properly wired and protected
- ✅ No PII introduced, maintains anonymous-first design
- ✅ Code follows existing codebase patterns
- ⚠️ Transaction safety is a minor concern but matches codebase style (non-blocking)
- ✅ All functionality appears correct and testable

**Recommendation:** Merge PR-2 as-is. Transaction safety can be addressed in a follow-up PR if production monitoring indicates it's needed (orphaned profiles are non-breaking and rare).

