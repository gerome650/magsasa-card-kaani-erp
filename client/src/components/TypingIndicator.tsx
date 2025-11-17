/**
 * TypingIndicator Component
 * 
 * Displays an animated "..." indicator to show that KaAni AI is processing a response.
 * Used while waiting for the first chunk to arrive from Gemini API during SSE streaming.
 */

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* KaAni Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
          K
        </div>
      </div>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="inline-block bg-muted rounded-lg px-4 py-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
