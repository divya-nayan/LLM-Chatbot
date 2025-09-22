'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import DocumentUpload from '@/components/DocumentUpload';
import KnowledgeBase from '@/components/KnowledgeBase';
import { ChatProvider } from '@/contexts/ChatContext';
import { DocumentProvider } from '@/contexts/DocumentContext';

export default function Home() {
  const [activeView, setActiveView] = useState<'chat' | 'documents' | 'knowledge'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <ChatProvider>
      <DocumentProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            activeView={activeView}
            onViewChange={setActiveView}
          />

          <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <div className="h-full overflow-hidden">
              {activeView === 'chat' && <ChatInterface />}
              {activeView === 'documents' && <DocumentUpload />}
              {activeView === 'knowledge' && <KnowledgeBase />}
            </div>
          </main>
        </div>
      </DocumentProvider>
    </ChatProvider>
  );
}