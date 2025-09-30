// API Configuration and Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';

export const API_ENDPOINTS = {
  TRANSCRIPT_LOAD: '/transcript/load',
  QA_ASK: '/qa/ask',
  MCQ_GENERATE: '/mcq/generate',
  MCQ_DOWNLOAD_PDF: '/mcq/download/pdf',
  MCQ_DOWNLOAD_DOCX: '/mcq/download/docx',
  BLOG_GENERATE: '/transcript/blog',
  CLIPS_GENERATE: '/transcript/clips',
} as const;

console.log('🔧 API Configuration loaded:', {
  baseUrl: API_BASE_URL,
  endpoints: API_ENDPOINTS
});