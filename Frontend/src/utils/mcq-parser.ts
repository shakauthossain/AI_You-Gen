import type { ParsedMCQ, MCQData } from '@/types/api';

export function parseMCQResponse(mcqResponse: string | any[] | MCQData): ParsedMCQ[] {
  console.log('🔍 Parsing MCQ response:', Array.isArray(mcqResponse) ? { type: 'array', length: mcqResponse.length } : typeof mcqResponse === 'string' ? { type: 'string', length: mcqResponse.length } : { type: 'object' });
  
  // Handle direct array format
  if (Array.isArray(mcqResponse)) {
    console.log('📝 Detected direct array format');
    return mcqResponse.map(mcq => ({
      id: mcq.number,
      question: mcq.question,
      options: {
        A: mcq.options[0] || '',
        B: mcq.options[1] || '',
        C: mcq.options[2] || '',
        D: mcq.options[3] || '',
      },
      correctAnswer: mcq.correct_answer as 'A' | 'B' | 'C' | 'D',
    }));
  }
  
  // Handle new JSON format (object with mcqs property)
  if (typeof mcqResponse === 'object' && mcqResponse && 'mcqs' in mcqResponse && mcqResponse.mcqs) {
    return mcqResponse.mcqs.map(mcq => ({
      id: mcq.number,
      question: mcq.question,
      options: {
        A: mcq.options[0] || '',
        B: mcq.options[1] || '',
        C: mcq.options[2] || '',
        D: mcq.options[3] || '',
      },
      correctAnswer: mcq.correct_answer as 'A' | 'B' | 'C' | 'D',
    }));
  }
  
  // Handle string format (try JSON first, then fall back to text parsing)
  if (typeof mcqResponse === 'string') {
    try {
      const parsed = JSON.parse(mcqResponse);
      if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
        console.log('📝 Detected JSON format in string');
        return parsed.mcqs.map((mcq: any) => ({
          id: mcq.number,
          question: mcq.question,
          options: {
            A: mcq.options[0] || '',
            B: mcq.options[1] || '',
            C: mcq.options[2] || '',
            D: mcq.options[3] || '',
          },
          correctAnswer: mcq.correct_answer as 'A' | 'B' | 'C' | 'D',
        }));
      }
    } catch (e) {
      console.log('📝 Not JSON format, falling back to text parsing');
    }
    
    return parseMCQText(mcqResponse);
  }
  
  return [];
}

export function parseMCQText(mcqText: string): ParsedMCQ[] {
  console.log('🔍 Parsing MCQ text:', { length: mcqText.length });
  
  // Split by ## MCQ markers and clean up the blocks
  const mcqBlocks = mcqText.split(/##\s*MCQ/i).filter(block => block.trim());
  console.log('📝 Found MCQ blocks:', mcqBlocks.length);
  
  const parsed: ParsedMCQ[] = [];
  
  mcqBlocks.forEach((block, index) => {
    try {
      const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line);
      console.log('🔍 Processing block:', { index, linesCount: lines.length, firstFewLines: lines.slice(0, 3) });
      
      let question = '';
      const options = { A: '', B: '', C: '', D: '' };
      let correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Parse question - look for "Question:" prefix or first substantial line
        if (line.startsWith('Question:')) {
          question = line.replace('Question:', '').trim();
          console.log('📋 Found question with prefix:', question.substring(0, 50) + '...');
        } else if (!question && !line.match(/^[A-D][\)\.]?\s*/i) && !line.match(/^Correct Answer/i) && line.length > 5) {
          // If no explicit "Question:" prefix, take the first substantial non-option line as question
          question = line;
          console.log('📋 Found question without prefix:', question.substring(0, 50) + '...');
        }
        
        // Parse options with improved regex to handle various formats
        else if (line.match(/^A[\)\.]?\s*/i)) {
          options.A = line.replace(/^A[\)\.]?\s*/i, '').trim();
          console.log('📝 Found option A:', options.A);
        } else if (line.match(/^B[\)\.]?\s*/i)) {
          options.B = line.replace(/^B[\)\.]?\s*/i, '').trim();
          console.log('📝 Found option B:', options.B);
        } else if (line.match(/^C[\)\.]?\s*/i)) {
          options.C = line.replace(/^C[\)\.]?\s*/i, '').trim();
          console.log('📝 Found option C:', options.C);
        } else if (line.match(/^D[\)\.]?\s*/i)) {
          options.D = line.replace(/^D[\)\.]?\s*/i, '').trim();
          console.log('📝 Found option D:', options.D);
        }
        
        // Parse correct answer with better extraction
        else if (line.match(/^Correct Answer/i)) {
          // Extract just the letter, handling various formats like "Correct Answer: A" or "Correct Answer: A)"
          const answerMatch = line.match(/([A-D])/i);
          if (answerMatch) {
            correctAnswer = answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
            console.log('✅ Found correct answer:', correctAnswer);
          }
        }
      }
      
      // Validate that we have all required parts
      if (question && options.A && options.B && options.C && options.D) {
        parsed.push({
          id: index + 1,
          question,
          options,
          correctAnswer,
        });
        console.log('✅ Successfully parsed MCQ:', { 
          id: index + 1, 
          question: question.substring(0, 50) + '...',
          correctAnswer,
          optionsCount: Object.values(options).filter(Boolean).length
        });
      } else {
        console.warn('⚠️ Incomplete MCQ block:', { 
          index, 
          hasQuestion: !!question, 
          questionLength: question.length,
          optionCounts: {
            A: !!options.A,
            B: !!options.B,
            C: !!options.C,
            D: !!options.D
          },
          correctAnswer,
          rawBlock: block.substring(0, 200) + '...'
        });
      }
    } catch (error) {
      console.error('❌ Error parsing MCQ block:', { index, error, block: block.substring(0, 200) + '...' });
    }
  });
  
  console.log('🎯 Total parsed MCQs:', parsed.length);
  return parsed;
}

export function timestampToSeconds(timestamp: string | undefined): number {
  if (!timestamp || typeof timestamp !== 'string') {
    console.warn('⚠️ timestampToSeconds received invalid timestamp:', timestamp);
    return 0;
  }
  
  // Parse timestamps like "0:03:21" or "3:21" into seconds
  const parts = timestamp.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 3) {
    // H:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS format
    return parts[0];
  }
  
  return 0;
}

export function secondsToTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

console.log('🔧 MCQ Parser utilities loaded');