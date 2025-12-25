
import React from 'react';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] p-4 rounded-2xl shadow-sm transition-colors duration-200 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none dark:bg-blue-700'
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        
        {message.groundingLinks && message.groundingLinks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-2">
            {message.groundingLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.uri}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  isUser 
                    ? 'border-blue-400 text-blue-100 hover:bg-blue-500 dark:border-blue-500/50' 
                    : 'border-gray-200 text-blue-600 hover:bg-blue-50 dark:border-slate-600 dark:text-blue-400 dark:hover:bg-slate-700'
                }`}
              >
                {link.type === 'map' ? '📍' : '🔍'} {link.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
