
import { format } from 'date-fns';

// Define types for our data
export interface SubjectPerformance {
  subjects?: {
    name: string;
  };
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

export interface ExamCompletion {
  created_at: string;
  status: string;
  total_marks: number;
  score: number;
}

export interface RecentExam {
  id: string;
  title: string;
  classes?: {
    name: string;
  };
  subjects?: {
    name: string;
  };
  status: string;
  created_at: string;
}

export interface TopStudent {
  profiles?: {
    name: string;
  };
  classes?: {
    name: string;
  };
  average_score: number;
  exams_taken: number;
}

export const formatSubjectPerformanceData = (subjectPerformance?: SubjectPerformance[]) => {
  if (!subjectPerformance || subjectPerformance.length === 0) return [];
  
  return subjectPerformance.map(item => ({
    subject: item.subjects?.name || 'Unknown',
    averageScore: Math.round(item.average_score),
    highestScore: Math.round(item.highest_score),
    lowestScore: Math.round(item.lowest_score)
  }));
};

export const formatExamCompletionData = (examCompletionData?: ExamCompletion[]) => {
  if (!examCompletionData || examCompletionData.length === 0) return [];
  
  return examCompletionData.map(item => ({
    date: format(new Date(item.created_at), 'MMM d, yyyy'),
    completed: item.status === 'completed' ? 1 : 0,
    totalMarks: item.total_marks,
    score: item.score
  }));
};

export const formatTopStudentsData = (topStudents?: TopStudent[]) => {
  if (!topStudents || topStudents.length === 0) return [];
  
  return topStudents
    .sort((a, b) => b.average_score - a.average_score)
    .slice(0, 5)
    .map(item => ({
      student: item.profiles?.name || 'Unknown',
      class: item.classes?.name || 'Unknown',
      averageScore: Math.round(item.average_score),
      examsTaken: item.exams_taken
    }));
};

export const calculateExamCompletionRate = (examCompletionData?: ExamCompletion[]) => {
  if (!examCompletionData || examCompletionData.length === 0) return 0;
  
  const completedExams = examCompletionData.filter(exam => exam.status === 'completed').length;
  return Math.round((completedExams / examCompletionData.length) * 100);
};

export const getClassDistributionData = (topStudents?: TopStudent[]) => {
  if (!topStudents || topStudents.length === 0) return [];
  
  const classCounts: Record<string, number> = {};
  
  topStudents.forEach(student => {
    const className = student.classes?.name || 'Unknown';
    classCounts[className] = (classCounts[className] || 0) + 1;
  });
  
  return Object.entries(classCounts).map(([name, value]) => ({ name, value }));
};
