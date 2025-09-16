// API Types and Schemas

export interface TranscriptLoadRequest {
  url: string;
}

export interface TranscriptLoadResponse {
  message: string;
  transcript?: string;
}

export interface QARequest {
  url: string;
  question: string;
}

export interface Snippet {
  content: string;
  timestamp: string;
  link: string;
}

// More defensive version in case backend sends incomplete data
export interface SafeSnippet {
  content?: string;
  timestamp?: string;  
  link?: string;
}

export interface QAResponse {
  answer: string;
  snippets: Snippet[];
}

export interface MCQGenerateRequest {
  url: string;
  num_mcqs: number;
}

export interface MCQGenerateResponse {
  mcqs: string | MCQItem[] | MCQData; // Can be string, direct array, or object with mcqs property
}

// Individual MCQ item
export interface MCQItem {
  number: number;
  question: string;
  options: string[];
  correct_answer: string;
}

// New format from backend
export interface MCQData {
  mcqs: MCQItem[];
}

export interface MCQDownloadRequest {
  url: string;
  num_mcqs: number;
}

export interface BlogGenerateRequest {
  req: {
    url: string;
  };
  style: string;
}

export interface BlogGenerateResponse {
  blog: string;
}

export interface ClipsGenerateRequest {
  req: {
    url: string;
  };
  num_clips: number;
}

export interface ClipsGenerateResponse {
  clips: Array<{
    title: string;
    content: string;
    timestamp?: string;
  }>;
}

// Parsed MCQ structure for frontend
export interface ParsedMCQ {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

// Application state types
export type TranscriptStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AppError {
  message: string;
  status?: number;
}

export interface SessionState {
  url: string;
  transcriptStatus: TranscriptStatus;
  error: AppError | null;
  questions: string[];
  transcript: string;
  conversations: Array<{
    question: string;
    answer: string;
    snippets: Snippet[];
    timestamp: Date;
    isSystem?: boolean;
  }>;
  mcqSets: Array<{
    mcqs: ParsedMCQ[];
    timestamp: Date;
    numMcqs: number;
  }>;
  allSnippets: Snippet[];
}

console.log('📝 API Types defined');