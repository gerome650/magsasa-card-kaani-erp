import React from 'react';
import { Audience, ChatMessage } from '../types';
import { ChoiceButtons } from './ChoiceButtons';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  onChoiceSelected: (choice: string) => void;
  isAwaitingChoice: boolean;
  audience: Audience;
  // ✅ add this so we can gate the full-response button
  isFinalModelMessage?: boolean;
}

const UserAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
    U
  </div>
);

const ModelAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
    K
  </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onChoiceSelected,
  isAwaitingChoice,
  audience,
  // ✅ receive it
  isFinalModelMessage,
}) => {
  const isUser = message.role === 'user';

  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white'
    : 'bg-gray-100 text-gray-800 border border-gray-200';

  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex items-start gap-3 ${containerClasses}`}>
      {!isUser && <ModelAvatar />}
      <div className={`rounded-xl p-4 max-w-3xl ${bubbleClasses}`}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          // ✅ pass it down so the renderer can show the button only on the final reply
          <MarkdownRenderer content={message.content} isFinalModelMessage={isFinalModelMessage} />
        )}

        {message.choices && isAwaitingChoice && (
          <ChoiceButtons
            choices={message.choices}
            onSelect={onChoiceSelected}
            audience={audience}
          />
        )}
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
};
