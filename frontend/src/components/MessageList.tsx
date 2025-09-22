'use client';

import ReactMarkdown from 'react-markdown';
import { UserIcon, CpuChipIcon } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'assistant' ? 'bg-gray-50' : ''
          } p-4 rounded-lg animate-fade-in`}
        >
          <div className="flex-shrink-0">
            {message.role === 'user' ? (
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-gray-800">
              {message.role === 'assistant' ? (
                <ReactMarkdown className="markdown-content">
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 bg-gray-50 p-4 rounded-lg animate-fade-in">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm text-gray-900">Assistant</span>
              <span className="text-xs text-gray-500">typing</span>
            </div>
            <div className="typing-indicator text-gray-600"></div>
          </div>
        </div>
      )}
    </>
  );
}