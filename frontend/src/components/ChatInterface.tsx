'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { useChat } from '@/contexts/ChatContext';
import { documentApi } from '@/services/api';
import { documentEvents, DOCUMENT_EVENTS } from '@/utils/eventEmitter';
import MessageList from './MessageList';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  processed: boolean;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, clearMessages, currentSession } = useChat();

  useEffect(() => {
    fetchDocuments();

    // Listen for document events to refresh the list
    const handleDocumentChange = () => {
      fetchDocuments();
      // Clear selection if a selected document was deleted
      setSelectedDocs(prev => {
        return prev.filter(id =>
          documents.some(doc => doc.id === id)
        );
      });
    };

    documentEvents.on(DOCUMENT_EVENTS.UPLOADED, handleDocumentChange);
    documentEvents.on(DOCUMENT_EVENTS.DELETED, handleDocumentChange);

    return () => {
      documentEvents.off(DOCUMENT_EVENTS.UPLOADED, handleDocumentChange);
      documentEvents.off(DOCUMENT_EVENTS.DELETED, handleDocumentChange);
    };
  }, [documents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDocDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.list(0, 100);
      setDocuments(response.data.documents.filter((doc: Document) => doc.processed));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await sendMessage(userMessage, selectedDocs);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const removeSelectedDoc = (docId: string) => {
    setSelectedDocs(prev => prev.filter(id => id !== docId));
  };

  const getSelectedDocNames = () => {
    return documents
      .filter(doc => selectedDocs.includes(doc.id))
      .map(doc => doc.filename);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {currentSession?.title || 'Chat Assistant'}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedDocs.length > 0
              ? `Using ${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} for context`
              : 'AI-powered chat (no documents selected)'}
          </p>
        </div>

        <button
          onClick={clearMessages}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear chat"
        >
          <ArrowPathIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="text-sm max-w-sm">
                Ask questions about your documents or have a general chat with the AI assistant.
              </p>
              {documents.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Select documents below to focus the conversation on specific files
                </p>
              )}
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t">
        {/* Document Selection Area */}
        {documents.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDocDropdown(!showDocDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{selectedDocs.length ? `${selectedDocs.length} docs selected` : 'Select documents'}</span>
                  <ChevronDownIcon className="w-3 h-3" />
                </button>

                {showDocDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="sticky top-0 bg-white border-b p-2">
                      <p className="text-xs text-gray-600 font-medium">Select documents for context:</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {documents.map(doc => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={() => toggleDocSelection(doc.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {doc.filename}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            {doc.file_type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Documents Pills */}
              {selectedDocs.length > 0 && (
                <>
                  {getSelectedDocNames().slice(0, 3).map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                    >
                      <span className="truncate max-w-[100px]">{name}</span>
                      <button
                        onClick={() => removeSelectedDoc(
                          documents.find(d => d.filename === name)?.id || ''
                        )}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {getSelectedDocNames().length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{getSelectedDocNames().length - 3} more
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDocs.length
                  ? `Ask about ${selectedDocs.length} selected document${selectedDocs.length > 1 ? 's' : ''}...`
                  : `Type your message (select documents above to use knowledge base)...`
              }
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}