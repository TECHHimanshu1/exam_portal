
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StudentDetails {
  classIds: string[];
  classNames: string[];
  rollNumbers: string[];
  isLoading: boolean;
  error: string | null;
  checkAttemptedExams: (examIds: string[]) => Promise<Record<string, boolean>>;
}

export function useStudentData(): StudentDetails {
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [rollNumbers, setRollNumbers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStudentDetails();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchStudentDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('student_details')
        .select('class_id, classes:class_id(name), roll_number')
        .eq('user_id', user?.id);

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setClassIds([]);
        setClassNames([]);
        setRollNumbers([]);
        console.log('No student details found for user:', user?.id);
        return;
      }

      setClassIds(data.map(item => item.class_id));
      setClassNames(data.map(item => item.classes?.name || 'Unknown Class'));
      setRollNumbers(data.map(item => item.roll_number));
      
      console.log('Student details loaded:', data);
    } catch (error: any) {
      console.error('Error loading student details:', error);
      setError(error.message);
      toast.error(`Failed to load student details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to check which exams a student has already attempted
  const checkAttemptedExams = async (examIds: string[]): Promise<Record<string, boolean>> => {
    if (!user || !examIds.length) return {};

    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('exam_id')
        .eq('student_id', user.id)
        .in('exam_id', examIds);

      if (error) throw error;

      // Create a map of exam_id -> true for attempted exams
      const attemptedExams: Record<string, boolean> = {};
      examIds.forEach(id => attemptedExams[id] = false);
      data?.forEach(result => attemptedExams[result.exam_id] = true);

      console.log('Attempted exams:', attemptedExams);
      return attemptedExams;
    } catch (error: any) {
      console.error('Error checking attempted exams:', error);
      return {};
    }
  };

  return {
    classIds,
    classNames,
    rollNumbers,
    isLoading,
    error,
    checkAttemptedExams
  };
}
