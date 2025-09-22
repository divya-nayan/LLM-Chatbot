'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useDocuments } from '@/contexts/DocumentContext';
import { documentEvents, DOCUMENT_EVENTS } from '@/utils/eventEmitter';
import toast from 'react-hot-toast';

export default function DocumentUpload() {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { documents, uploadDocument, deleteDocument, refreshDocuments } = useDocuments();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => new Set(prev).add(fileId));

      try {
        await uploadDocument(file);
        toast.success(`${file.name} uploaded successfully`);
        documentEvents.emit(DOCUMENT_EVENTS.UPLOADED);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      } finally {
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }

    refreshDocuments();
  }, [uploadDocument, refreshDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10485760, // 10MB
  });

  const handleDelete = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId);
        toast.success('Document deleted successfully');
        refreshDocuments();
        documentEvents.emit(DOCUMENT_EVENTS.DELETED);
      } catch (error) {
        toast.error('Failed to delete document');
        console.error('Delete error:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">Document Management</h2>
        <p className="text-sm text-gray-500">Upload and manage your documents</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium text-primary-600">Drop the files here...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop files here, or click to select
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Supported formats: PDF, DOCX, TXT, MD, JPG, PNG (Max 10MB)
              </p>
            </>
          )}
        </div>

        {uploadingFiles.size > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Uploading...</h3>
            <div className="space-y-2">
              {Array.from(uploadingFiles).map((fileId) => (
                <div key={fileId} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-sm text-gray-700">Processing...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">{doc.filename}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.processed ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" title="Processed" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-yellow-600" title="Processing" />
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length === 0 && uploadingFiles.size === 0 && (
          <div className="mt-12 text-center text-gray-500">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload documents to build your knowledge base</p>
          </div>
        )}
      </div>
    </div>
  );
}