'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { documentApi, knowledgeApi } from '@/services/api';
import { documentEvents, DOCUMENT_EVENTS } from '@/utils/eventEmitter';
import toast from 'react-hot-toast';

interface SearchResult {
  content: string;
  metadata: {
    file_path: string;
    file_type: string;
    chunk_id: number;
    filename?: string;
  };
  score: number;
}

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  created_at: string;
}

interface Stats {
  total_chunks: number;
  total_documents: number;
  collection_name: string;
  embedding_model: string;
}

const FILE_TYPE_ICONS: Record<string, JSX.Element> = {
  pdf: <DocumentTextIcon className="w-5 h-5 text-red-500" />,
  docx: <DocumentTextIcon className="w-5 h-5 text-blue-500" />,
  txt: <DocumentTextIcon className="w-5 h-5 text-gray-500" />,
  md: <DocumentTextIcon className="w-5 h-5 text-purple-500" />,
  jpg: <PhotoIcon className="w-5 h-5 text-green-500" />,
  jpeg: <PhotoIcon className="w-5 h-5 text-green-500" />,
  png: <PhotoIcon className="w-5 h-5 text-cyan-500" />,
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [searchInDoc, setSearchInDoc] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchDocuments();

    // Listen for document events
    const handleDocumentChange = () => {
      fetchDocuments();
      fetchStats();
    };

    documentEvents.on(DOCUMENT_EVENTS.UPLOADED, handleDocumentChange);
    documentEvents.on(DOCUMENT_EVENTS.DELETED, handleDocumentChange);

    return () => {
      documentEvents.off(DOCUMENT_EVENTS.UPLOADED, handleDocumentChange);
      documentEvents.off(DOCUMENT_EVENTS.DELETED, handleDocumentChange);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await knowledgeApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await documentApi.list(0, 100);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await knowledgeApi.search(
        searchQuery,
        10,
        selectedFileType !== 'all' ? selectedFileType : undefined
      );

      setSearchResults(response.data.results);
      if (response.data.results.length === 0) {
        toast('No results found. Try a different query.', {
          icon: '🔍',
        });
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document? This will also remove it from the knowledge base.')) {
      try {
        await documentApi.delete(documentId);
        toast.success('Document deleted successfully');
        fetchDocuments();
        fetchStats();
        documentEvents.emit(DOCUMENT_EVENTS.DELETED);
      } catch (error) {
        toast.error('Failed to delete document');
        console.error('Delete error:', error);
      }
    }
  };

  const clearKnowledgeBase = async () => {
    if (confirm('Are you sure you want to clear the entire knowledge base? This cannot be undone.')) {
      try {
        await knowledgeApi.clear();
        toast.success('Knowledge base cleared successfully');
        setSearchResults([]);
        fetchStats();
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to clear knowledge base');
        console.error('Clear error:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchInDoc ?
      doc.filename.toLowerCase().includes(searchInDoc.toLowerCase()) : true;
    const matchesType = selectedFileType === 'all' || doc.file_type === selectedFileType;
    return matchesSearch && matchesType;
  });

  // Get unique file types
  const fileTypes = Array.from(new Set(documents.map(d => d.file_type)));

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Knowledge Base</h2>
            <p className="text-sm text-gray-500">Search and manage your document collection</p>
          </div>

          {stats && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-700">{stats.total_documents}</div>
                <div className="text-gray-500">Documents</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700">{stats.total_chunks}</div>
                <div className="text-gray-500">Chunks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search Section */}
        <div className="p-6 border-b bg-gray-50">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content in your knowledge base..."
                className="w-full pl-10 pr-32 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSearching}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <FunnelIcon className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-4 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="flex gap-4 p-3 bg-white rounded-lg border border-gray-200">
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All File Types</option>
                  {fileTypes.map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Search Results ({searchResults.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {FILE_TYPE_ICONS[result.metadata.file_type] || <BookOpenIcon className="w-5 h-5" />}
                      <span className="text-sm font-medium text-gray-700">
                        {result.metadata.filename || result.metadata.file_path.split('/').pop()}
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {Math.round(result.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{result.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              Documents ({filteredDocuments.length})
            </h3>
            <input
              type="text"
              value={searchInDoc}
              onChange={(e) => setSearchInDoc(e.target.value)}
              placeholder="Filter documents..."
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {isLoadingDocs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid gap-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {FILE_TYPE_ICONS[doc.file_type] || <BookOpenIcon className="w-5 h-5" />}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.processed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Processed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          Processing
                        </span>
                      )}
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-600">No documents found</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload documents to build your knowledge base
              </p>
            </div>
          )}

          {stats && stats.total_chunks > 0 && (
            <div className="mt-8 pt-6 border-t">
              <button
                onClick={clearKnowledgeBase}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Entire Knowledge Base
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}