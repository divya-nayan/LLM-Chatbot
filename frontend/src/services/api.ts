import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const chatApi = {
  createSession: (title?: string) => api.post('/chat/sessions', { title }),
  listSessions: (skip = 0, limit = 10) =>
    api.get(`/chat/sessions?skip=${skip}&limit=${limit}`),
  sendMessage: (message: string, sessionId?: string, useKnowledgeBase = true) =>
    api.post('/chat/message', {
      message,
      session_id: sessionId,
      use_knowledge_base: useKnowledgeBase,
      stream: false,
    }),
  getSessionMessages: (sessionId: string, skip = 0, limit = 50) =>
    api.get(`/chat/sessions/${sessionId}/messages?skip=${skip}&limit=${limit}`),
};

export const documentApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (skip = 0, limit = 10) => api.get(`/documents/list?skip=${skip}&limit=${limit}`),
  delete: (documentId: string) => api.delete(`/documents/${documentId}`),
};

export const knowledgeApi = {
  search: (query: string, nResults = 5, fileType?: string) =>
    api.post('/knowledge/search', {
      query,
      n_results: nResults,
      file_type: fileType,
    }),
  getStats: () => api.get('/knowledge/statistics'),
  clear: () => api.delete('/knowledge/clear'),
};

export const healthApi = {
  check: () => api.get('/health'),
  checkLLM: () => api.get('/health/llm'),
  checkVectorStore: () => api.get('/health/vector-store'),
};