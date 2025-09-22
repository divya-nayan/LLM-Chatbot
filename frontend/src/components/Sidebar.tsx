'use client';

import {
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView: 'chat' | 'documents' | 'knowledge';
  onViewChange: (view: 'chat' | 'documents' | 'knowledge') => void;
}

export default function Sidebar({ isOpen, onToggle, activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    {
      id: 'chat',
      label: 'Chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'AI Chat Assistant',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: DocumentIcon,
      description: 'Upload & Manage',
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: BookOpenIcon,
      description: 'Search & Explore',
    },
  ] as const;

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-10 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg">ChatBot AI</span>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeView === item.id
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors`}
          >
            <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
}