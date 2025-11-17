# Conversation Search Feature

## Overview

The Conversation Search feature enables users to quickly find past conversations with KaAni AI by searching through both conversation titles and message content. This feature provides real-time search results with debouncing for optimal performance.

## Features

### 1. Full-Text Search
- **Title Search**: Searches across all conversation titles
- **Message Content Search**: Searches through the content of all messages in conversations
- **Combined Results**: Returns conversations that match either the title or message content

### 2. Real-Time Filtering
- **Debounced Input**: 300ms delay prevents excessive API calls while typing
- **Instant Results**: Search results update automatically as you type
- **Clear Button**: Quick way to reset search and view all conversations

### 3. User Interface
- **Search Input**: Located in the conversation sidebar header
- **Search Icon**: Visual indicator for the search functionality
- **Clear Button**: X icon appears when search query is active
- **Result Count**: Displays number of matching conversations
- **Empty State**: Shows helpful message when no results are found

## How to Use

### Basic Search
1. Navigate to the KaAni Chat page
2. Locate the search input in the conversation sidebar (below "New Conversation" button)
3. Type your search query
4. Results will appear automatically after a brief delay

### Search Tips
- Search is **case-insensitive**
- Partial matches are supported (e.g., "farm" will match "farming", "farmer")
- Search works across both conversation titles and message content
- Results are sorted by most recently updated conversations first

### Clearing Search
- Click the **X** button in the search input
- Or delete all text from the search field
- All conversations will be restored

## Technical Implementation

### Backend (tRPC + Database)

#### API Endpoint
```typescript
conversations.search.query({ query: string })
```

#### Database Function
```typescript
searchConversations(userId: number, query: string)
```

**Search Logic:**
1. Searches conversation titles using SQL `LIKE` operator
2. Searches message content using SQL `LIKE` operator
3. Joins results from both searches
4. Removes duplicates
5. Sorts by `updatedAt` (newest first)

#### SQL Query Pattern
```sql
-- Title search
SELECT * FROM conversations 
WHERE userId = ? AND title LIKE '%query%'

-- Message content search
SELECT conversations.* FROM conversations
INNER JOIN chatMessages ON chatMessages.conversationId = conversations.id
WHERE conversations.userId = ? AND chatMessages.content LIKE '%query%'
```

### Frontend (React + TypeScript)

#### State Management
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [isSearching, setIsSearching] = useState(false);
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

#### Debounced Search Handler
```typescript
const handleSearchChange = (query: string) => {
  setSearchQuery(query);
  
  // Clear previous timeout
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }
  
  // Debounce by 300ms
  searchTimeoutRef.current = setTimeout(async () => {
    if (query.trim() === "") {
      // Reload all conversations
      const convos = await trpc.conversations.list.query();
      setConversations(convos);
    } else {
      // Perform search
      const results = await trpc.conversations.search.query({ query });
      setConversations(results);
    }
  }, 300);
};
```

#### UI Components

**Search Input** (`ConversationSidebar.tsx`):
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    placeholder="Search conversations..."
    className="w-full pl-9 pr-9 py-2 text-sm border rounded-lg"
  />
  {searchQuery && (
    <button onClick={() => onSearchChange("")}>
      <XCircle className="w-4 h-4" />
    </button>
  )}
</div>
```

**Result Count**:
```tsx
{searchQuery && (
  <div className="px-4 py-2 text-xs text-muted-foreground border-b">
    {conversations.length} result{conversations.length !== 1 ? 's' : ''} found
  </div>
)}
```

**Empty State**:
```tsx
{conversations.length === 0 && searchQuery && (
  <div className="p-8 text-center text-muted-foreground">
    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p className="text-sm">No conversations found</p>
    <p className="text-xs mt-1">Try a different search term</p>
  </div>
)}
```

## Performance Considerations

### Debouncing
- **300ms delay** prevents excessive API calls
- Timeout is cleared on each keystroke
- Only the final query (after user stops typing) triggers the search

### Database Optimization
- Indexed `userId` column for fast filtering
- Indexed `title` column for faster LIKE queries
- Consider adding full-text search indexes for large datasets

### Frontend Optimization
- Search state managed locally (no re-renders on every keystroke)
- Results replace existing conversation list (no additional memory)
- Active conversation preserved during search

## Future Enhancements

### Planned Features
1. **Search Highlighting**: Highlight matching text in conversation titles
2. **Message Snippets**: Show preview of matching message content
3. **Advanced Filters**: Filter by date range, message count, etc.
4. **Keyboard Shortcuts**: Ctrl+K to focus search input
5. **Search History**: Remember recent searches
6. **Fuzzy Search**: Match similar terms (e.g., "farmin" → "farming")

### Performance Improvements
1. **Full-Text Search**: Implement MySQL FULLTEXT indexes
2. **Elasticsearch**: For very large datasets (10,000+ conversations)
3. **Client-Side Caching**: Cache search results for repeated queries
4. **Pagination**: Limit search results to top 50 matches

## Troubleshooting

### Search Not Working
1. Check database connection in server logs
2. Verify `DATABASE_URL` environment variable is set
3. Ensure user is authenticated (search requires login)

### Slow Search Performance
1. Check database indexes on `conversations` and `chatMessages` tables
2. Monitor query execution time in database logs
3. Consider adding FULLTEXT indexes for large datasets

### No Results Found
1. Verify search query is not empty
2. Check if conversations exist for the logged-in user
3. Try simpler search terms (single words)

## Related Files

### Backend
- `server/routers.ts` - tRPC endpoint definition
- `server/db.ts` - Database query implementation
- `drizzle/schema.ts` - Database schema

### Frontend
- `client/src/pages/KaAniChat.tsx` - Main chat page with search integration
- `client/src/components/ConversationSidebar.tsx` - Sidebar with search UI

## Testing

### Manual Testing Checklist
- [ ] Search by conversation title
- [ ] Search by message content
- [ ] Search with partial matches
- [ ] Search with special characters
- [ ] Clear search and view all conversations
- [ ] Search with no results
- [ ] Search with multiple matching conversations
- [ ] Verify debouncing (no lag while typing)
- [ ] Test on mobile devices

### Test Scenarios

**Scenario 1: Title Search**
1. Create conversation titled "Rice Farming Tips"
2. Search for "rice"
3. Verify conversation appears in results

**Scenario 2: Message Content Search**
1. Send message "How do I control pests?"
2. Search for "pests"
3. Verify conversation with that message appears

**Scenario 3: No Results**
1. Search for "xyz123nonexistent"
2. Verify empty state message appears
3. Click clear button
4. Verify all conversations are restored

**Scenario 4: Debouncing**
1. Type "farming" quickly
2. Verify only one API call is made (after 300ms)
3. Check network tab for single request

## Conclusion

The Conversation Search feature provides a fast, intuitive way for users to find past conversations with KaAni AI. With full-text search across titles and messages, debounced input, and a clean UI, users can quickly locate the information they need.
