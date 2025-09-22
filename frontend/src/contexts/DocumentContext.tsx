'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: Date;
}

interface DocumentContextType {
  documents: Document[];
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    refreshDocuments();
  }, []);

  const refreshDocuments = async () => {
    try {
      const response = await api.get('/documents/list');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await refreshDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      await api.delete(`/documents/${documentId}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        uploadDocument,
        deleteDocument,
        refreshDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};