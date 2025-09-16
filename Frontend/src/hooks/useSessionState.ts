import { useState, useCallback } from 'react';
import type { SessionState, Snippet, ParsedMCQ, AppError } from '@/types/api';

const initialState: SessionState = {
  url: '',
  transcriptStatus: 'idle',
  error: null,
  questions: [],
  transcript: '',
  conversations: [],
  mcqSets: [],
  allSnippets: [],
};

export function useSessionState() {
  const [state, setState] = useState<SessionState>(initialState);

  const updateUrl = useCallback((url: string) => {
    console.log('🔄 Updating URL:', url);
    setState(prev => ({
      ...initialState,
      url: url.trim(),
    }));
  }, []);

  const setTranscriptStatus = useCallback((status: SessionState['transcriptStatus']) => {
    console.log('🔄 Transcript status changed:', status);
    setState(prev => ({ ...prev, transcriptStatus: status }));
  }, []);

  const setError = useCallback((error: AppError | null) => {
    console.log('🔄 Error state changed:', error);
    setState(prev => ({ ...prev, error }));
  }, []);

  const addQuestion = useCallback((question: string) => {
    console.log('➕ Adding question to history:', question.substring(0, 50) + '...');
    setState(prev => ({
      ...prev,
      questions: [question, ...prev.questions.filter(q => q !== question)].slice(0, 10), // Keep last 10 unique questions
    }));
  }, []);

  const addConversation = useCallback((question: string, answer: string, snippets: Snippet[], isSystem = false) => {
    console.log('💬 Adding conversation:', {
      question: question.substring(0, 50) + '...',
      answer: answer.substring(0, 100) + '...',
      snippetsCount: snippets.length,
      isSystem
    });
    
    setState(prev => ({
      ...prev,
      conversations: [{
        question,
        answer,
        snippets,
        timestamp: new Date(),
        isSystem,
      }, ...prev.conversations],
      allSnippets: [...snippets, ...prev.allSnippets],
    }));
  }, []);

  const addSystemMessage = useCallback((message: string) => {
    console.log('🤖 Adding system message:', message);
    setState(prev => ({
      ...prev,
      conversations: [{
        question: '',
        answer: message,
        snippets: [],
        timestamp: new Date(),
        isSystem: true,
      }, ...prev.conversations],
    }));
  }, []);

  const setTranscript = useCallback((transcript: string) => {
    console.log('📝 Setting transcript:', { length: transcript.length });
    setState(prev => ({ ...prev, transcript }));
  }, []);

  const addMCQSet = useCallback((mcqs: ParsedMCQ[], numMcqs: number) => {
    console.log('📝 Adding MCQ set:', { count: mcqs.length, numMcqs });
    setState(prev => ({
      ...prev,
      mcqSets: [{
        mcqs,
        timestamp: new Date(),
        numMcqs,
      }, ...prev.mcqSets],
    }));
  }, []);

  const clearSession = useCallback(() => {
    console.log('🗑️ Clearing session');
    setState(initialState);
  }, []);

  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch {
      return false;
    }
  }, []);

  const canLoadTranscript = state.url && isValidUrl(state.url) && state.transcriptStatus !== 'loading';
  const canAskQuestions = state.transcriptStatus === 'loaded';
  const canGenerateMCQs = state.transcriptStatus === 'loaded';

  return {
    state,
    actions: {
      updateUrl,
      setTranscriptStatus,
      setError,
      addQuestion,
      addConversation,
      addSystemMessage,
      setTranscript,
      addMCQSet,
      clearSession,
    },
    computed: {
      isValidUrl,
      canLoadTranscript,
      canAskQuestions,
      canGenerateMCQs,
    },
  };
}

console.log('🔧 Session state hook loaded');