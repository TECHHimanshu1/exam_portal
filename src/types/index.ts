
export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Teacher extends User {
  role: 'teacher';
  subjects?: string[];
}

export interface Student extends User {
  role: 'student';
  class?: string;
  rollNumber?: string;
}

// Define the possible shapes for question options
export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionOptionsMap = Record<string, string>;

// Allow options to be an array of strings as well for backward compatibility
export type QuestionOptionsType = QuestionOption[] | QuestionOptionsMap | string[];

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'descriptive';
  options?: QuestionOptionsType;
  marks: number;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  correctAnswer?: string | number;
}

export interface QuestionForm {
  text: string;
  type: 'mcq' | 'descriptive';
  marks: number;
  options: string[];
  correctAnswer: string;
  subject: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  startTime: string;
  endTime: string;
  createdBy: string;
  questions: Question[];
  status: 'draft' | 'scheduled' | 'active' | 'completed';
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  answers: Answer[];
}

export interface Answer {
  questionId: string;
  answer: string | number;
  isCorrect?: boolean;
  marks?: number;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: 'student' | 'teacher' | 'exam' | 'class';
  createdAt: string;
  data: any;
}

export interface SystemSettings {
  id: string;
  siteName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailSettings?: {
    smtpServer: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
  };
  notificationSettings?: {
    enableEmailNotifications: boolean;
    enableBrowserNotifications: boolean;
  };
}

export interface DatabaseExam {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  class_id: string;
  duration: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  created_by: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}
