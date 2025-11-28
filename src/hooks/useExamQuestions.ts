
import { useState, useEffect } from 'react';
import { Question, QuestionOptionsType, QuestionOptionsMap } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * A hook to fetch questions for a specific exam
 */
export function useExamQuestions(examId: string | undefined) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching questions for exam ID: ${examId}`);
        
        // Get all questions for this exam in a single query with a join
        const { data: examQuestionDetails, error: questionsError } = await supabase
          .from('exam_questions')
          .select(`
            question_id,
            questions:question_id (
              id, 
              text, 
              type, 
              options, 
              marks, 
              correct_answer,
              subject_id
            )
          `)
          .eq('exam_id', examId);
        
        if (questionsError) throw questionsError;
        
        console.log('Exam questions with details:', examQuestionDetails);
        
        if (!examQuestionDetails || examQuestionDetails.length === 0) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }
        
        // Extract questions from the nested structure
        const questionDetails = examQuestionDetails
          .map(eq => eq.questions)
          .filter(Boolean); // Filter out any null values
          
        console.log('Extracted question details:', questionDetails);
        
        if (questionDetails.length === 0) {
          throw new Error("No question details found for this exam. This could be due to permission issues or missing question records.");
        }
        
        // Transform the questions to match our Question type
        const transformedQuestions: Question[] = questionDetails.map(q => {
          // Ensure we strictly type as 'mcq' | 'descriptive'
          const questionType = q.type === 'mcq' ? 'mcq' : 'descriptive';
          
          return {
            id: q.id,
            text: q.text,
            type: questionType,
            options: parseOptions(q.options),
            marks: q.marks,
            correctAnswer: q.correct_answer,
            subject: q.subject_id
          };
        });
        
        console.log('Transformed questions:', transformedQuestions);
        setQuestions(transformedQuestions);
      } catch (err: any) {
        console.error('Error fetching exam questions:', err);
        setError(err.message || 'Failed to load exam questions');
        toast.error("Failed to load exam questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [examId]);

  // Helper function to parse question options
  const parseOptions = (options: any): QuestionOptionsType => {
    if (!options) return [];
    
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return parsed;
      } catch (e) {
        console.error('Failed to parse options string:', e);
        return [];
      }
    }
    
    if (Array.isArray(options)) {
      if (options.length === 0) return [];
      
      if (typeof options[0] === 'string') {
        return options.map((opt, index) => ({ 
          id: String(index), 
          text: opt 
        }));
      }
      
      return options;
    }
    
    if (options && typeof options === 'object') {
      return options as QuestionOptionsMap;
    }
    
    return [];
  };

  return { questions, isLoading, error };
}
