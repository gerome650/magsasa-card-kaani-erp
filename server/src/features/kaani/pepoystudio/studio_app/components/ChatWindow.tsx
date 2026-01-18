import React, { useEffect, useRef, useState } from 'react';
import { Audience, ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from './LoadingSpinner';
import { TIPS } from '../data/tips';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isAwaitingChoice: boolean;
  onChoiceSelected: (choice: string) => void;
  audience: Audience;
}

const LightbulbIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.706-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-1.414 8.486a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
  </svg>
);

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  isAwaitingChoice,
  onChoiceSelected,
  audience,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [currentTip, setCurrentTip] = useState<string>('');

  useEffect(() => {
    if (isLoading) {
      const randomIndex = Math.floor(Math.random() * TIPS.length);
      setCurrentTip(TIPS[randomIndex]);
    }
  }, [isLoading]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-grow p-4 overflow-y-auto bg-transparent">
      <div className="space-y-4">
        {messages.map((msg, index) => {
          // ✅ Add this flag to identify the final assistant message
          const isFinalModelMessage =
            index === messages.length - 1 && !isLoading && msg.role === 'model';

          return (
            <MessageBubble
              key={index}
              message={msg}
              onChoiceSelected={onChoiceSelected}
              isAwaitingChoice={index === messages.length - 1 && isAwaitingChoice}
              audience={audience}
              isFinalModelMessage={isFinalModelMessage} // ✅ Pass down
            />
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <LoadingSpinner />
              <div className="flex flex-col">
                <span className="text-gray-500 italic">Maaari lang po mag hintay...</span>
                {currentTip && (
                  <div className="mt-2 flex items-center text-xs text-gray-600 bg-green-50/80 p-2 rounded-lg border border-green-200/50 max-w-sm">
                    <LightbulbIcon />
                    <span>
                      <strong>Tip:</strong> {currentTip}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
