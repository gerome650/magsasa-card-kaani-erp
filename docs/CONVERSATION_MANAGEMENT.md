# Conversation Management System

## Overview

The conversation management system allows users to organize their interactions with KaAni AI into separate, persistent chat threads. Each conversation maintains its own message history and can be renamed, switched between, or deleted independently.

## Architecture

### Database Schema

**conversations table:**
```sql
CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**chatMessages table (updated):**
```sql
CREATE TABLE chatMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  conversationId INT NOT NULL,  -- Foreign key to conversations
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backend API (tRPC)

**conversations router:**

1. **conversations.list** - Get all conversations for current user
   - Type: Query
   - Returns: Array of conversations ordered by updatedAt (newest first)

2. **conversations.create** - Create new conversation
   - Type: Mutation
   - Input: `{ title: string }`
   - Returns: `{ conversationId: number }`

3. **conversations.updateTitle** - Rename conversation
   - Type: Mutation
   - Input: `{ id: number, title: string }`
   - Returns: `{ success: boolean }`

4. **conversations.delete** - Delete conversation and all its messages
   - Type: Mutation
   - Input: `{ id: number }`
   - Returns: `{ success: boolean }`

5. **conversations.getMessages** - Get all messages in a conversation
   - Type: Query
   - Input: `{ conversationId: number }`
   - Returns: Array of messages ordered by createdAt (oldest first)

### Database Functions

**Conversation Management:**
- `createConversation(userId, title)` - Create new conversation
- `getConversationsByUserId(userId)` - Get all user conversations
- `updateConversationTitle(id, title)` - Rename conversation
- `deleteConversation(id)` - Delete conversation and cascade delete messages
- `touchConversation(id)` - Update updatedAt timestamp

**Message Management:**
- `createChatMessage(userId, conversationId, role, content, category)` - Save message
- `getChatMessagesByConversationId(conversationId)` - Get conversation messages

## Frontend Components

### ConversationSidebar

**Location:** `client/src/components/ConversationSidebar.tsx`

**Props:**
```typescript
interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
  onRenameConversation: (id: number, newTitle: string) => void;
}
```

**Features:**
- New Conversation button (green, with Plus icon)
- Conversation list with titles and timestamps
- Active conversation highlighting (green border)
- Inline rename functionality (Edit icon)
- Delete confirmation (Trash icon)
- Empty state for no conversations
- Relative timestamps (Just now, 5m ago, 2h ago, 3d ago, Jan 15)

**UI/UX:**
- Width: 320px (80 Tailwind units)
- Hover effects on conversation cards
- Edit/Delete buttons appear on hover
- Click outside or ESC to cancel rename
- Enter to save rename
- Confirmation dialog before delete

### KaAniChat (Updated)

**Location:** `client/src/pages/KaAniChat.tsx`

**State Management:**
```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [isLoadingConversations, setIsLoadingConversations] = useState(true);
const [isLoadingMessages, setIsLoadingMessages] = useState(false);
```

**Lifecycle:**

1. **Component Mount:**
   - Load all conversations via `conversations.list`
   - Auto-select most recent conversation
   - If no conversations exist, create first one automatically

2. **Conversation Selection:**
   - Load messages via `conversations.getMessages`
   - Display welcome message if no messages exist
   - Show loading spinner during message fetch

3. **Message Send:**
   - Add user message to UI immediately
   - Stream AI response via SSE
   - Auto-generate title from first user message
   - Update conversation's updatedAt timestamp
   - Re-sort conversations by updatedAt

4. **Conversation Actions:**
   - Create: Generate new conversation, switch to it
   - Delete: Remove conversation, switch to another or create new
   - Rename: Update title in database and local state

## User Flows

### Creating First Conversation

1. User logs in and navigates to KaAni Chat
2. System detects no conversations exist
3. Automatically creates "New Conversation"
4. Shows welcome message from KaAni
5. User sends first message
6. Title auto-updates to first 50 characters of message

### Switching Conversations

1. User clicks conversation in sidebar
2. System loads messages for selected conversation
3. Chat area updates to show conversation history
4. Input field remains active for new messages

### Renaming Conversation

1. User hovers over conversation card
2. Edit icon appears
3. User clicks Edit icon
4. Inline input field appears with current title
5. User edits title and presses Enter
6. Title updates in database and UI
7. Toast notification confirms success

### Deleting Conversation

1. User hovers over conversation card
2. Delete icon appears (red)
3. User clicks Delete icon
4. Confirmation dialog appears
5. User confirms deletion
6. Conversation and all messages deleted
7. System switches to another conversation or creates new one
8. Toast notification confirms deletion

## Features

### Auto-Title Generation

When user sends first message in a new conversation:
```typescript
const isFirstMessage = messages.filter(m => m.role === "user").length === 0;
if (isFirstMessage) {
  const title = userMessageContent.slice(0, 50) + 
    (userMessageContent.length > 50 ? "..." : "");
  await handleRenameConversation(activeConversationId, title);
}
```

### Conversation Sorting

Conversations are sorted by `updatedAt` timestamp (newest first):
- Sending a message updates the conversation's timestamp
- Most recently active conversation appears at top
- Easy to find ongoing conversations

### Empty States

**No Conversations:**
```
[MessageSquare Icon]
No conversations yet
Start a new conversation with KaAni
```

**No Messages in Conversation:**
```
Kumusta [User Name]! Ako si KaAni, ang iyong agricultural assistant.
Paano kita matutulungan ngayong araw?
```

### Relative Timestamps

Conversations display human-readable timestamps:
- < 1 minute: "Just now"
- < 60 minutes: "5m ago", "45m ago"
- < 24 hours: "2h ago", "18h ago"
- < 7 days: "3d ago", "6d ago"
- >= 7 days: "Jan 15", "Dec 3"

## Technical Implementation

### State Synchronization

Conversations list is kept in sync with database:
- Create: Add to local state immediately, then persist
- Delete: Remove from local state, then delete from database
- Rename: Update local state, then persist to database
- Sort: Re-sort after any updatedAt change

### Message Persistence

Messages are saved to database during streaming:
- User message: Saved before streaming starts
- AI response: Saved after streaming completes
- Both linked to active conversationId

### Error Handling

**Conversation Load Failure:**
- Show error toast
- Keep sidebar visible with empty state
- Allow user to create new conversation

**Message Load Failure:**
- Show error toast
- Display welcome message as fallback
- Allow user to send new messages

**Delete Failure:**
- Show error toast
- Keep conversation in list
- Allow retry

**Rename Failure:**
- Show error toast
- Revert to original title
- Allow retry

## Performance Considerations

### Lazy Loading

- Conversations loaded once on mount
- Messages loaded only when conversation is selected
- Streaming responses update UI in real-time

### Optimistic Updates

- UI updates immediately for better UX
- Database operations happen in background
- Rollback on error

### Caching

- Conversation list cached in component state
- Messages cached per conversation
- No redundant API calls when switching back

## Future Enhancements

### Planned Features

1. **Search conversations** - Full-text search across titles and messages
2. **Archive conversations** - Hide old conversations without deleting
3. **Export conversation** - Download as PDF or text file
4. **Conversation tags** - Categorize by topic (farming, loans, weather)
5. **Pin conversations** - Keep important conversations at top
6. **Conversation sharing** - Share conversation with other users
7. **Message reactions** - Like/dislike AI responses
8. **Conversation analytics** - Track topics, response times, satisfaction

### Mobile Optimization

1. **Collapsible sidebar** - Hamburger menu for mobile
2. **Swipe gestures** - Swipe to switch conversations
3. **Bottom navigation** - Easier thumb reach on mobile
4. **Conversation preview** - Show last message in list

### Accessibility

1. **Keyboard navigation** - Tab through conversations, Enter to select
2. **Screen reader support** - ARIA labels for all actions
3. **High contrast mode** - Better visibility for low vision users
4. **Focus indicators** - Clear visual focus states

## Migration Notes

### Breaking Changes

- Old chat messages without conversationId are incompatible
- Users will need to start fresh conversations
- Chat history from before migration is not accessible

### Migration Strategy

1. Run database migration to add conversations table
2. Add conversationId column to chatMessages
3. Optionally: Create default conversation for each user
4. Optionally: Migrate old messages to default conversation
5. Update frontend to use new conversation system

### Rollback Plan

If issues arise:
1. Revert database schema changes
2. Restore previous KaAniChat component
3. Remove ConversationSidebar component
4. Restore old kaaniService functions

## Related Documentation

- [Typing Indicator Feature](./TYPING_INDICATOR.md)
- [SSE Streaming Guide](./SSE_STREAMING_GUIDE.md)
- [KaAni Streaming Implementation](./KAANI_STREAMING_IMPLEMENTATION.md)

## Summary

The conversation management system provides a complete multi-threaded chat experience for KaAni AI. Users can organize their agricultural questions and advice into separate conversations, making it easy to track different topics, reference past discussions, and maintain context across multiple farming seasons.

Key benefits:
- **Organization** - Separate topics into distinct conversations
- **Persistence** - All conversations saved to database
- **Flexibility** - Create, rename, delete conversations freely
- **Context** - Each conversation maintains its own history
- **Usability** - Intuitive sidebar navigation and management
