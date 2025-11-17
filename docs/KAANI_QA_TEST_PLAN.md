# KaAni AI Chat - Comprehensive QA Test Plan

**Date:** November 17, 2025  
**Tester:** QA Agent  
**Version:** 51aea16a  

---

## Test Scope

### Features to Test
1. UI/UX Layout and Design
2. Chat Messaging (Send/Receive)
3. SSE Streaming and Typing Indicator
4. Conversation Management
5. Role/Context/Dialect Selection
6. Suggested Prompts
7. Sample Formats Button
8. Error Handling
9. Data Persistence
10. Performance and Responsiveness

---

## Test Cases

### 1. UI/UX Layout and Design

#### TC-001: Main Header Integration
- [ ] Main MAGSASA-CARD header is visible at top
- [ ] Green header bar with logo is present
- [ ] "Ask KaAni AI" button is visible in header
- [ ] Active state shows when on KaAni page

#### TC-002: Sub-Header Layout
- [ ] Sub-header appears below main header
- [ ] Role tabs (Farmer/Technician) are visible
- [ ] Context dropdown shows options (Loan Matching/Risk Scoring)
- [ ] Dialect selector shows 8 Filipino dialects
- [ ] Black hairline border separates sub-header from chat area

#### TC-003: Chat Container
- [ ] White background for chat area
- [ ] Messages display correctly (user right, AI left)
- [ ] Timestamps show on messages
- [ ] Scrolling works smoothly
- [ ] Auto-scroll to bottom on new messages

#### TC-004: Input Bar
- [ ] Dark rounded input bar at bottom
- [ ] Circular green send button on right
- [ ] Placeholder text is visible
- [ ] Input expands for long text
- [ ] Black hairline border separates from chat area

#### TC-005: Conversation Menu
- [ ] Dropdown menu accessible from header
- [ ] Shows list of conversations
- [ ] "New Conversation" button visible
- [ ] Search input functional
- [ ] Black hairline border separates from chat

---

### 2. Chat Messaging Functionality

#### TC-006: Send Message
- [ ] Click send button sends message
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Input clears after sending
- [ ] User message appears immediately

#### TC-007: Receive AI Response
- [ ] AI response appears after user message
- [ ] Response is formatted correctly
- [ ] Markdown rendering works (bold, lists, etc.)
- [ ] Response saves to database
- [ ] Conversation history persists

#### TC-008: Empty Message Handling
- [ ] Cannot send empty message
- [ ] Send button disabled when input empty
- [ ] No error thrown on empty submit

---

### 3. SSE Streaming and Typing Indicator

#### TC-009: Typing Indicator
- [ ] Shows immediately when message sent
- [ ] Three bouncing dots animation
- [ ] Hides when first chunk arrives
- [ ] Positioned correctly (left side)

#### TC-010: SSE Streaming
- [ ] Response streams word-by-word
- [ ] No artificial delay (real-time)
- [ ] Chunks append correctly
- [ ] Full response completes
- [ ] No duplicate text

#### TC-011: Streaming Error Handling
- [ ] Network error shows user-friendly message
- [ ] API error displays properly
- [ ] Subscription unsubscribes on error
- [ ] Can retry after error

---

### 4. Conversation Management

#### TC-012: Create New Conversation
- [ ] "New Conversation" button works
- [ ] Creates empty conversation
- [ ] Switches to new conversation
- [ ] Auto-generates title from first message
- [ ] Saves to database

#### TC-013: Switch Conversations
- [ ] Click conversation switches view
- [ ] Messages load correctly
- [ ] Previous conversation state preserved
- [ ] No message duplication
- [ ] Smooth transition

#### TC-014: Rename Conversation
- [ ] Click title to edit
- [ ] Input appears inline
- [ ] Save on Enter key
- [ ] Cancel on Escape key
- [ ] Updates in database

#### TC-015: Delete Conversation
- [ ] Delete button shows on hover
- [ ] Confirmation dialog appears
- [ ] Deletes from database
- [ ] Switches to another conversation
- [ ] Cannot delete last conversation

#### TC-016: Search Conversations
- [ ] Search input filters list
- [ ] Searches titles and message content
- [ ] Debounced (300ms delay)
- [ ] Clear button works
- [ ] Shows result count

---

### 5. Role/Context/Dialect Selection

#### TC-017: Role Selection
- [ ] Farmer tab selectable
- [ ] Technician tab selectable
- [ ] Active state highlights selected
- [ ] Selection persists during session
- [ ] Affects AI response context

#### TC-018: Context Selection
- [ ] Loan Matching option selectable
- [ ] Risk Scoring option selectable
- [ ] Dropdown closes after selection
- [ ] Selection persists during session
- [ ] Affects AI response context

#### TC-019: Dialect Selection
- [ ] All 8 dialects selectable (Tagalog, Cebuano, Ilonggo, Waray, Kapampangan, Pangasinan, Bikol, Ilocano)
- [ ] Dropdown closes after selection
- [ ] Selection persists during session
- [ ] Affects AI response language

---

### 6. Suggested Prompts

#### TC-020: Suggested Prompts Display
- [ ] Green pill buttons visible
- [ ] At least 3-5 prompts shown
- [ ] Prompts relevant to role/context
- [ ] Responsive layout (wraps on mobile)

#### TC-021: Suggested Prompts Interaction
- [ ] Click prompt fills input field
- [ ] Can edit filled prompt
- [ ] Send button enabled after click
- [ ] Prompt disappears after use (optional)

---

### 7. Sample Formats Button

#### TC-022: Sample Formats Button
- [ ] Button visible in header
- [ ] Click opens dialog/modal
- [ ] Shows sample conversation formats
- [ ] Close button works
- [ ] ESC key closes dialog

---

### 8. Error Handling

#### TC-023: Network Errors
- [ ] Offline mode shows error
- [ ] Retry button available
- [ ] Error message user-friendly
- [ ] No app crash

#### TC-024: API Errors
- [ ] Quota exceeded shows message
- [ ] Unauthorized redirects to login
- [ ] Server error shows retry option
- [ ] Errors logged to console

#### TC-025: Validation Errors
- [ ] Empty conversation title rejected
- [ ] Invalid input sanitized
- [ ] Max length enforced (if applicable)

---

### 9. Data Persistence

#### TC-026: Message Persistence
- [ ] Messages save to database
- [ ] Refresh page preserves messages
- [ ] Logout/login preserves messages
- [ ] Messages isolated by user

#### TC-027: Conversation Persistence
- [ ] Conversations save to database
- [ ] Refresh preserves conversation list
- [ ] Titles persist after rename
- [ ] Deleted conversations removed

#### TC-028: Settings Persistence
- [ ] Role selection persists (session)
- [ ] Context selection persists (session)
- [ ] Dialect selection persists (session)

---

### 10. Performance and Responsiveness

#### TC-029: Load Time
- [ ] Page loads in < 2 seconds
- [ ] Conversations load in < 1 second
- [ ] Messages load in < 1 second
- [ ] No blocking UI during load

#### TC-030: Streaming Performance
- [ ] First chunk arrives in < 500ms
- [ ] Streaming feels real-time
- [ ] No lag or stuttering
- [ ] Memory usage acceptable

#### TC-031: Mobile Responsiveness
- [ ] Layout adapts to mobile screens
- [ ] Sub-header controls accessible
- [ ] Input bar usable on mobile
- [ ] Conversation menu works on mobile

---

## Bug Tracking

### Critical Bugs (P0)
- [ ] 

### High Priority Bugs (P1)
- [ ] 

### Medium Priority Bugs (P2)
- [ ] 

### Low Priority Bugs (P3)
- [ ] 

---

## Test Results Summary

**Total Test Cases:** 31  
**Passed:** 0  
**Failed:** 0  
**Blocked:** 0  
**Not Tested:** 31  

**Pass Rate:** 0%  
**Status:** Not Started  

---

## Notes

- Test with demo authentication (farmer/officer/manager accounts)
- Test with real Gemini API integration
- Test across different browsers (Chrome, Firefox, Safari)
- Test on different devices (Desktop, Tablet, Mobile)
