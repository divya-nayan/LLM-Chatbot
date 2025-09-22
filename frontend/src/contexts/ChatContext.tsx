'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: Date;
}

interface ChatContextType {
  messages: Message[];
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  sendMessage: (content: string, selectedDocIds?: string[]) => Promise<void>;
  clearMessages: () => void;
  createSession: (title?: string) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setSessions(response.data.sessions);

      if (response.data.sessions.length > 0 && !currentSession) {
        setCurrentSession(response.data.sessions[0]);
        loadSessionMessages(response.data.sessions[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(
        response.data.messages.map((msg: any) => ({
          id: uuidv4(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }))
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createSession = async (title?: string) => {
    try {
      const response = await api.post('/chat/sessions', { title });
      const newSession = response.data;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  const switchSession = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      await loadSessionMessages(sessionId);
    }
  };

  const sendMessage = async (content: string, selectedDocIds?: string[]) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await api.post('/chat/message', {
        message: content,
        session_id: currentSession?.id,
        use_knowledge_base: selectedDocIds && selectedDocIds.length > 0,
        selected_documents: selectedDocIds || [],
        stream: false,
      });

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!currentSession && response.data.session_id) {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentSession,
        sessions,
        sendMessage,
        clearMessages,
        createSession,
        switchSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};