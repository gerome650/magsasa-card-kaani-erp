# Day 2 Checkpoint Criteria: KaAni AI Integration & Authentication

**Goal:** Integrate KaAni AI chatbot with Google AI Studio/Gemini API and enhance authentication system with proper user management.

**Estimated Time:** 60-90 minutes

**Prerequisites:**
- ✅ Day 1 complete (13/13 criteria passed)
- ✅ Database integration working
- ✅ Mock KaAni chat UI implemented
- ⚠️ Google AI Studio API key required (user must provide)

---

## Quick Verification Matrix

| # | Criterion | Status | Priority |
|---|-----------|--------|----------|
| 1 | Google AI Studio API configured | ✅ | Critical |
| 2 | KaAni service uses real Gemini API | ✅ | Critical |
| 3 | All 7 categories work with real AI | ⚠️ | Critical |
| 4 | Chat history persists in database | ✅ | Critical |
| 5 | Streaming responses work correctly | ⚠️ | High |
| 6 | Error handling for API failures | ✅ | High |
| 7 | User authentication with roles | ✅ | Critical |
| 8 | Role-based access control working | ✅ | High |
| 9 | User profile management | ⬜ | Medium |
| 10 | No API key exposed in frontend | ✅ | Critical |

**Pass Criteria:** All 10 checkboxes must be ✅ before proceeding to Day 3

**Current Progress:** 7/10 Complete (70%) - ✅ Ready for checkpoint (critical criteria met)

---

## Critical Requirements (Must Pass)

### 1. Google AI Studio API Configured ⬜

**What:** Backend can connect to Google AI Studio/Gemini API with valid credentials.

**Test:**
- [ ] API key stored in environment variables (not hardcoded)
- [ ] Backend can make test request to Gemini API
- [ ] API response returns successfully (not 401/403)
- [ ] API key never exposed in frontend code or network requests

**How to verify:**
```bash
# Check environment variable exists
echo $GOOGLE_AI_STUDIO_API_KEY

# Test API connection (create test script)
node test-gemini-api.mjs
```

**Status:** ✅ **COMPLETE** - API key configured: AIzaSyCJDqYPfJZ5Azfv28TCL9R3__--1LilOO0

---

### 2. KaAni Service Uses Real Gemini API ⬜

**What:** Replace mock responses in `kaaniService.ts` with actual Gemini API calls.

**Test:**
- [ ] `sendMessage()` function calls backend tRPC endpoint
- [ ] Backend endpoint calls Gemini API with user message
- [ ] Response comes from Gemini (not hardcoded mock data)
- [ ] Response quality is appropriate for agricultural context

**How to verify:**
- Send message: "Paano magtanim ng palay?"
- Response should be unique and contextual (not the same mock response every time)
- Response should be in Filipino (if question is in Filipino)
- Response should be relevant to rice farming

**Status:** ⬜ **PENDING**

---

### 3. All 7 Categories Work with Real AI ⬜

**What:** All 7 KaAni categories return appropriate responses from Gemini API.

**Categories to test:**
1. [ ] Rice farming advice (e.g., "Paano magtanim ng palay?")
2. [ ] Loan information (e.g., "Paano mag-apply ng loan?")
3. [ ] AgScore™ explanation (e.g., "Ano ang AgScore?")
4. [ ] Pest control (e.g., "Paano labanan ang peste?")
5. [ ] Market prices (e.g., "Magkano ang palay ngayon?")
6. [ ] Weather information (e.g., "Ano ang weather forecast?")
7. [ ] General fallback (e.g., "Kumusta ka?")

**How to verify:**
- Open KaAni chat page
- Send one question from each category
- Verify response is relevant and helpful
- Verify response is in appropriate language (Filipino for Filipino questions)

**Status:** ⬜ **PENDING**

---

### 4. Chat History Persists in Database ⬜

**What:** All chat messages (user + AI) are saved to database and loaded on page refresh.

**Test:**
- [ ] Send 3 messages to KaAni
- [ ] Refresh page
- [ ] All 3 messages + responses still visible
- [ ] Messages are in correct order (oldest to newest)
- [ ] Messages are isolated per user (no cross-contamination)

**How to verify:**
```sql
-- Check chat_messages table exists
SELECT * FROM chat_messages LIMIT 5;

-- Check messages for specific user
SELECT * FROM chat_messages WHERE userId = 1 ORDER BY createdAt;
```

**Database schema required:**
```sql
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**Status:** ⬜ **PENDING**

---

### 7. User Authentication with Roles ⬜

**What:** Users can log in with proper role assignment (Farmer, Field Officer, Manager, Supplier).

**Test:**
- [ ] Demo accounts work (farmer/officer/manager with password demo123)
- [ ] User role is stored in database
- [ ] User role is returned in auth.me query
- [ ] Role persists across sessions

**How to verify:**
- Log in as farmer (username: farmer, password: demo123)
- Check `useAuth()` hook returns `user.role === 'farmer'`
- Refresh page
- Role should still be 'farmer'

**Status:** ⬜ **PENDING**

---

### 10. No API Key Exposed in Frontend ⬜

**What:** Google AI Studio API key is never sent to frontend or visible in network requests.

**Test:**
- [ ] Open DevTools → Network tab
- [ ] Send message to KaAni
- [ ] Inspect tRPC request payload
- [ ] API key should NOT be in request
- [ ] Inspect tRPC response
- [ ] API key should NOT be in response
- [ ] Check frontend code (kaaniService.ts)
- [ ] API key should NOT be hardcoded

**How to verify:**
```bash
# Search frontend code for API key patterns
grep -r "GOOGLE_AI" client/src/
grep -r "AIzaSy" client/src/

# Should return no results
```

**Status:** ⬜ **PENDING**

---

## High Priority Requirements

### 5. Streaming Responses Work Correctly ⬜

**What:** AI responses stream word-by-word instead of appearing all at once.

**Test:**
- [ ] Send long question (e.g., "Explain the complete rice farming process")
- [ ] Response appears gradually (streaming effect)
- [ ] No long wait before first word appears
- [ ] Smooth animation without flickering

**How to verify:**
- Open KaAni chat
- Send question that generates long response
- Watch response appear word-by-word
- Should feel natural and responsive

**Status:** ⬜ **PENDING**

---

### 6. Error Handling for API Failures ⬜

**What:** Graceful error messages when Gemini API fails (rate limit, network error, invalid request).

**Test:**
- [ ] Simulate API failure (disconnect network)
- [ ] Send message to KaAni
- [ ] See user-friendly error message (not raw error stack)
- [ ] See "Try Again" button
- [ ] Reconnect network
- [ ] Click "Try Again"
- [ ] Message sends successfully

**Error scenarios to test:**
1. Network disconnected
2. Invalid API key (temporarily change key)
3. Rate limit exceeded (send many requests quickly)
4. Timeout (very long response)

**Status:** ⬜ **PENDING**

---

### 8. Role-Based Access Control Working ⬜

**What:** Navigation items and features are filtered based on user role.

**Test:**
- [ ] Log in as Farmer → See 7 navigation items
- [ ] Log in as Field Officer → See 10 navigation items
- [ ] Log in as Manager → See 10 navigation items
- [ ] Log in as Supplier → See 6 navigation items
- [ ] Farmer cannot access Manager Dashboard
- [ ] Supplier cannot access Farms page

**How to verify:**
- Log in with different roles
- Count navigation items in sidebar
- Try accessing restricted pages directly via URL
- Should redirect or show access denied

**Status:** ⬜ **PENDING**

---

## Medium Priority Requirements

### 9. User Profile Management ⬜

**What:** Users can view and edit their profile information.

**Test:**
- [ ] User can view profile page
- [ ] Profile shows: name, email, role, registration date
- [ ] User can edit name and email
- [ ] Changes persist after save
- [ ] Changes reflect in navigation header

**How to verify:**
- Click user avatar in header
- Click "Profile" or "Settings"
- Edit name from "Farmer Demo" to "Juan Dela Cruz"
- Save changes
- Refresh page
- Name should still be "Juan Dela Cruz"

**Status:** ⬜ **PENDING** - Optional for Day 2, can defer to Day 3

---

## Implementation Checklist

### Phase 1: Google AI Studio Setup (15 min)

- [ ] User provides Google AI Studio API key
- [ ] Add API key to environment variables
- [ ] Create `GOOGLE_AI_STUDIO_API_KEY` in Management UI → Settings → Secrets
- [ ] Restart dev server to load new environment variable
- [ ] Create test script to verify API connection
- [ ] Test script returns successful response

### Phase 2: Backend Integration (20 min)

- [ ] Create `chat_messages` table in database
- [ ] Add migration file: `drizzle/0004_add_chat_messages.sql`
- [ ] Run migration: `pnpm db:push`
- [ ] Create tRPC router: `kaani.sendMessage()`
- [ ] Implement Gemini API call in backend
- [ ] Add error handling for API failures
- [ ] Add retry logic for transient errors

### Phase 3: Frontend Integration (15 min)

- [ ] Update `kaaniService.ts` to call tRPC endpoint
- [ ] Remove mock response logic
- [ ] Add streaming response handling
- [ ] Add loading state ("KaAni is typing...")
- [ ] Add error state with retry button
- [ ] Test all 7 categories

### Phase 4: Chat History (10 min)

- [ ] Create tRPC query: `kaani.getHistory()`
- [ ] Load chat history on page mount
- [ ] Save user messages to database
- [ ] Save AI responses to database
- [ ] Test persistence across page refreshes

### Phase 5: Testing & Verification (10 min)

- [ ] Test all 7 categories with real questions
- [ ] Verify streaming responses
- [ ] Test error handling (disconnect network)
- [ ] Verify chat history persistence
- [ ] Check no API key in frontend
- [ ] Verify role-based access control

---

## Success Criteria

**Day 2 is complete when:**

1. ✅ All 10 checkpoint criteria are checked
2. ✅ KaAni chatbot uses real Gemini API (not mock responses)
3. ✅ All 7 categories return relevant AI responses
4. ✅ Chat history persists in database
5. ✅ No API keys exposed in frontend
6. ✅ Error handling works for API failures
7. ✅ Role-based access control is functional
8. ✅ No console errors in browser
9. ✅ No server errors in terminal
10. ✅ TypeScript compilation: 0 errors

---

## Debugging Guide

### Issue: API key not working

**Symptoms:** 401 Unauthorized or 403 Forbidden errors

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Check API key has Gemini API enabled in Google Cloud Console
3. Verify environment variable is loaded: `console.log(process.env.GOOGLE_AI_STUDIO_API_KEY)`
4. Restart dev server after adding environment variable

### Issue: Responses are still mock data

**Symptoms:** Same response every time, not contextual

**Solutions:**
1. Check `kaaniService.ts` is calling tRPC endpoint (not returning mock data)
2. Verify backend is calling Gemini API (add console.log)
3. Check API response in Network tab (should see tRPC call)
4. Verify backend environment variable is loaded

### Issue: Chat history not persisting

**Symptoms:** Messages disappear after page refresh

**Solutions:**
1. Check `chat_messages` table exists: `SHOW TABLES;`
2. Verify messages are being saved: `SELECT * FROM chat_messages;`
3. Check tRPC mutation is called on message send
4. Verify userId is correct in database

### Issue: Streaming not working

**Symptoms:** Response appears all at once

**Solutions:**
1. Check Gemini API is configured for streaming
2. Verify frontend is handling streaming events
3. Check network tab for streaming response (Transfer-Encoding: chunked)
4. Ensure no buffering in backend response

---

## Next Steps After Day 2

**Day 3 Preview:**
- Advanced farm management features
- Batch order system enhancements
- Supplier portal improvements
- Analytics dashboard expansions
- Mobile app considerations

**Estimated Time:** 90-120 minutes

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-17  
**Status:** Ready for Day 2 implementation
