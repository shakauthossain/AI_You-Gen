import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import type {
  TranscriptLoadRequest,
  TranscriptLoadResponse,
  QARequest,
  QAResponse,
  MCQGenerateRequest,
  MCQGenerateResponse,
  MCQDownloadRequest,
  BlogGenerateRequest,
  BlogGenerateResponse,
  ClipsGenerateRequest,
  ClipsGenerateResponse,
} from '@/types/api';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    console.log('🚀 ApiService initialized with base URL:', this.baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('📡 Making API request:', {
      method: options.method || 'GET',
      url,
      body: options.body ? JSON.parse(options.body as string) : null
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('📡 API response received:', {
        status: response.status,
        statusText: response.statusText,
        url
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url
        });
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', { url, data });
      return data;
    } catch (error) {
      console.error('💥 API Request failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async loadTranscript(request: TranscriptLoadRequest): Promise<TranscriptLoadResponse> {
    console.log('🎬 Loading transcript for URL:', request.url);
    return this.request<TranscriptLoadResponse>(API_ENDPOINTS.TRANSCRIPT_LOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async askQuestion(request: QARequest): Promise<QAResponse> {
    console.log('❓ Asking question:', {
      url: request.url,
      question: request.question.substring(0, 100) + (request.question.length > 100 ? '...' : '')
    });
    return this.request<QAResponse>(API_ENDPOINTS.QA_ASK, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateMCQs(request: MCQGenerateRequest): Promise<MCQGenerateResponse> {
    console.log('📝 Generating MCQs:', request);
    return this.request<MCQGenerateResponse>(API_ENDPOINTS.MCQ_GENERATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async downloadMCQsPDF(request: MCQDownloadRequest): Promise<Blob> {
    console.log('📄 Downloading MCQs as PDF:', request);
    const url = `${this.baseUrl}${API_ENDPOINTS.MCQ_DOWNLOAD_PDF}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDF Download Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ PDF downloaded successfully');
    return response.blob();
  }

  async downloadMCQsDOCX(request: MCQDownloadRequest): Promise<Blob> {
    console.log('📄 Downloading MCQs as DOCX:', request);
    const url = `${this.baseUrl}${API_ENDPOINTS.MCQ_DOWNLOAD_DOCX}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DOCX Download Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ DOCX downloaded successfully');
    return response.blob();
  }

  async generateBlog(request: BlogGenerateRequest): Promise<BlogGenerateResponse> {
    console.log('📝 Generating blog:', request);
    return this.request<BlogGenerateResponse>(API_ENDPOINTS.BLOG_GENERATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateClips(request: ClipsGenerateRequest): Promise<ClipsGenerateResponse> {
    console.log('🎬 Generating clips:', request);
    return this.request<ClipsGenerateResponse>(API_ENDPOINTS.CLIPS_GENERATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService();
console.log('🔧 API Service exported');