# KaAni AI Chat - Bugs Found During QA Testing

**Date:** November 17, 2025  
**Tester:** QA Agent  
**Version:** 51aea16a  

---

## Critical Bugs (P0) - Must Fix Immediately

### BUG-001: Missing Conversation Persistence to Database
**Severity:** P0 - Critical  
**Component:** Message Handling  
**Description:** Messages are displayed in UI but not being saved to the database after AI response completes.

**Current Behavior:**
- User sends message → shows in UI
- AI responds via SSE → shows in UI
- Page refresh → messages disappear (not persisted)

**Expected Behavior:**
- After AI response completes, both user message and AI response should be saved to database via tRPC mutation
- Messages should persist across page refreshes

**Root Cause:**
In `KaAniChat.tsx` lines 169-260, the `handleSend` function:
1. Adds messages to local state only
2. Calls `sendMessageToKaAniSSE` for streaming
3. **MISSING:** No call to save messages to database after streaming completes

**Fix Required:**
Add `trpcClient.conversations.addMessage.mutate()` calls after streaming completes to persist both user and AI messages.

**Impact:** High - Users lose all chat history on refresh

---

### BUG-002: Suggested Prompts Not Clickable
**Severity:** P0 - Critical UX Issue  
**Component:** SuggestedPrompts Component  
**Description:** The green pill suggested prompts are displayed but have no click handlers implemented.

**Current Behavior:**
- Prompts display correctly
- Clicking does nothing
- No feedback to user

**Expected Behavior:**
- Click prompt → fills input field with prompt text
- User can edit and send
- Prompt provides quick start for conversation

**Root Cause:**
`SuggestedPrompts.tsx` likely missing `onClick` handler or not passing callback from parent.

**Fix Required:**
1. Add `onPromptClick` prop to SuggestedPrompts component
2. Pass callback from KaAniChat that calls `setInput(promptText)`
3. Add click handlers to prompt buttons

**Impact:** High - Key feature completely non-functional

---

### BUG-003: No Sample Formats Dialog Implementation
**Severity:** P1 - High  
**Component:** Header Button  
**Description:** "Sample Formats" button in header is missing or not implemented.

**Current Behavior:**
- No visible button for sample formats
- Feature mentioned in requirements but not implemented

**Expected Behavior:**
- Button in header/sub-header
- Click opens dialog/modal
- Shows example conversation formats for different contexts

**Fix Required:**
Create SampleFormatsDialog component with examples for:
- Loan matching conversations
- Risk scoring conversations  
- Farmer vs Technician role examples
- Dialect-specific examples

**Impact:** Medium - Helpful onboarding feature missing

---

## High Priority Bugs (P1) - Fix Before Production

### BUG-004: Conversation Search Not Implemented
**Severity:** P1  
**Component:** Conversation Dropdown Menu  
**Description:** Search input in conversation menu exists but filtering logic not implemented.

**Current Behavior:**
- Search input visible in dropdown
- Typing does nothing
- All conversations always shown

**Expected Behavior:**
- Type in search → filters conversation list
- Searches titles and message content
- Debounced for performance (300ms)

**Fix Required:**
1. Add `searchQuery` state
2. Filter conversations based on query
3. Add debounce to search input
4. Show result count

**Impact:** Medium - Usability issue with many conversations

---

### BUG-005: No Empty State for New Conversations
**Severity:** P1  
**Component:** Chat Container  
**Description:** When conversation is empty, just shows blank white space with no guidance.

**Expected Behavior:**
- Show welcome message
- Display suggested prompts prominently
- Show quick tips for using KaAni
- Guide user to start conversation

**Fix Required:**
Add empty state component that shows when `messages.length === 0`:
```tsx
{messages.length === 0 ? (
  <EmptyState role={selectedRole} context={selectedContext} />
) : (
  // existing message list
)}
```

**Impact:** Medium - Poor first-time user experience

---

### BUG-006: No Error Boundary for Chat Component
**Severity:** P1  
**Component:** KaAniChat Page  
**Description:** If any error occurs in chat (API failure, network issue), entire page crashes.

**Expected Behavior:**
- Errors caught gracefully
- User-friendly error message shown
- Ability to retry
- Page remains functional

**Fix Required:**
Wrap KaAniChat in ErrorBoundary with retry mechanism.

**Impact:** Medium - Poor error resilience

---

### BUG-007: Textarea Not Auto-Resizing
**Severity:** P1  
**Component:** Input Bar  
**Description:** Textarea for message input doesn't expand as user types long messages.

**Current Behavior:**
- Fixed height textarea
- Long messages require scrolling within small box
- Poor UX for multi-line messages

**Expected Behavior:**
- Auto-resize as user types
- Max height limit (e.g., 200px)
- Smooth transition

**Fix Required:**
Add auto-resize logic to textarea:
```tsx
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }
}, [input]);
```

**Impact:** Medium - UX issue for longer messages

---

## Medium Priority Bugs (P2) - Fix Soon

### BUG-008: No Loading State for Conversations List
**Severity:** P2  
**Component:** Conversation Dropdown  
**Description:** While loading conversations, dropdown shows empty with no skeleton/spinner.

**Fix Required:**
Show skeleton loader or spinner while `isLoadingConversations === true`.

**Impact:** Low - Minor UX issue

---

### BUG-009: No Confirmation Dialog for Delete Conversation
**Severity:** P2  
**Component:** Conversation Management  
**Description:** Deleting conversation happens immediately without confirmation.

**Expected Behavior:**
- Click delete → confirmation dialog appears
- User confirms → conversation deleted
- User cancels → no action

**Fix Required:**
Add AlertDialog component before calling `handleDeleteConversation`.

**Impact:** Medium - Risk of accidental deletion

---

### BUG-010: Timestamp Format Not User-Friendly
**Severity:** P2  
**Component:** Message Display  
**Description:** Message timestamps likely showing raw date format instead of relative time.

**Expected Behavior:**
- "Just now" for < 1 minute
- "5 minutes ago" for recent
- "Today at 2:30 PM" for same day
- "Yesterday at 3:45 PM" for yesterday
- "Nov 15 at 10:00 AM" for older

**Fix Required:**
Use date formatting library (date-fns) or create helper function.

**Impact:** Low - UX polish

---

### BUG-011: No Character/Word Count for Input
**Severity:** P2  
**Component:** Input Bar  
**Description:** No indication of message length, could hit API limits unexpectedly.

**Expected Behavior:**
- Show character count below textarea
- Warning at 80% of limit
- Block sending at 100% of limit

**Fix Required:**
Add character counter component, set reasonable limit (e.g., 2000 chars).

**Impact:** Low - Edge case issue

---

### BUG-012: Voice Input Button Non-Functional
**Severity:** P2  
**Component:** KaAniSubHeader  
**Description:** Green circular button in sub-header appears to be for voice input but is just visual.

**Current Behavior:**
- Button displays
- No click handler
- No functionality

**Expected Behavior:**
- Click to start voice recording
- Speech-to-text conversion
- Fill input field with transcribed text

**Fix Required:**
Either:
1. Implement voice input feature (complex)
2. Remove button if not ready for production
3. Add tooltip "Coming soon" and disable

**Impact:** Low - Feature not critical

---

## Low Priority Bugs (P3) - Nice to Have

### BUG-013: No Keyboard Shortcuts
**Severity:** P3  
**Component:** Global  
**Description:** Missing keyboard shortcuts for common actions.

**Suggested Shortcuts:**
- `Ctrl/Cmd + N` - New conversation
- `Ctrl/Cmd + K` - Focus search
- `Esc` - Close dropdown/dialogs
- `Ctrl/Cmd + /` - Show shortcuts help

**Impact:** Low - Power user feature

---

### BUG-014: No Copy Button for AI Responses
**Severity:** P3  
**Component:** Message Display  
**Description:** No easy way to copy AI responses to clipboard.

**Expected Behavior:**
- Hover over AI message → copy button appears
- Click → copies to clipboard
- Toast confirmation

**Impact:** Low - Convenience feature

---

### BUG-015: No Export Conversation Feature
**Severity:** P3  
**Component:** Conversation Menu  
**Description:** Cannot export conversation history as text/PDF.

**Expected Behavior:**
- Export button in conversation dropdown
- Choose format (TXT, PDF, Markdown)
- Downloads conversation with timestamps

**Impact:** Low - Nice-to-have feature

---

## Summary

**Total Bugs Found:** 15

**By Severity:**
- P0 (Critical): 3 bugs
- P1 (High): 4 bugs
- P2 (Medium): 5 bugs
- P3 (Low): 3 bugs

**Must Fix Before Production:** 7 bugs (P0 + P1)

**Estimated Fix Time:**
- P0 bugs: 4-6 hours
- P1 bugs: 3-4 hours
- Total critical path: 7-10 hours

---

## Next Steps

1. Fix P0 bugs first (BUG-001, BUG-002, BUG-003)
2. Fix P1 bugs (BUG-004 through BUG-007)
3. Test all fixes thoroughly
4. Consider P2/P3 bugs for future iterations
