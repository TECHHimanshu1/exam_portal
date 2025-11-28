
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Loader2, BookOpen, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExamResult {
  id: string;
  score: number;
  total_marks: number;
  status: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  answers: Record<string, string>;
  exam: {
    id: string;
    title: string;
    subject: {
      name: string;
    };
    class: {
      name: string;
    };
  };
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'descriptive';
  options?: { id: string; text: string }[];
  marks: number;
  correct_answer?: string;
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-500';
  if (percentage >= 70) return 'text-emerald-500';
  if (percentage >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 70) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const getGradeLabel = (percentage: number) => {
  if (percentage >= 90) return { label: 'A', color: 'bg-green-500' };
  if (percentage >= 80) return { label: 'B', color: 'bg-emerald-500' };
  if (percentage >= 70) return { label: 'C', color: 'bg-blue-500' };
  if (percentage >= 60) return { label: 'D', color: 'bg-amber-500' };
  if (percentage >= 50) return { label: 'E', color: 'bg-orange-500' };
  return { label: 'F', color: 'bg-red-500' };
};

const ExamResultDetails = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (resultId) {
      fetchResultDetails();
    }
  }, [resultId, user, navigate]);

  const fetchResultDetails = async () => {
    setIsLoading(true);
    try {
      // Get result details
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          total_marks,
          status,
          feedback,
          created_at,
          updated_at,
          answers,
          exam:exams(
            id,
            title,
            subject:subjects(name),
            class:classes(name)
          )
        `)
        .eq('id', resultId)
        .eq('student_id', user?.id)
        .single();

      if (error) throw error;
      
      setResult(data as ExamResult);
      
      // Get exam questions
      const { data: examQuestions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('question_id')
        .eq('exam_id', data.exam.id);
      
      if (questionsError) throw questionsError;
      
      if (examQuestions && examQuestions.length > 0) {
        const questionIds = examQuestions.map(q => q.question_id);
        
        const { data: questionDetails, error: detailsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);
        
        if (detailsError) throw detailsError;
        
        // Transform question data to match our interface
        const transformedQuestions: Question[] = questionDetails.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type === 'mcq' ? 'multiple_choice' : 'descriptive',
          options: q.options as { id: string; text: string }[] | undefined,
          marks: q.marks,
          correct_answer: q.correct_answer
        }));
        
        setQuestions(transformedQuestions);
      }
    } catch (error: any) {
      console.error('Error fetching result details:', error);
      toast.error(error.message || 'Failed to load result details');
      navigate('/student/results');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout requiredRole="student">
        <Alert className="bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No result found. This result might have been deleted or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/student/results')}>
          Go Back to Results
        </Button>
      </DashboardLayout>
    );
  }

  const scorePercentage = Math.round((result.score / result.total_marks) * 100);
  const grade = getGradeLabel(scorePercentage);

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/student/results')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Exam Result</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle>Result Summary</CardTitle>
              <CardDescription>
                {new Date(result.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(scorePercentage)}`}>
                  {scorePercentage}%
                </div>
                <div className="mt-2 flex justify-center">
                  <Badge className={`${grade.color} text-white px-3 py-1 text-lg`}>
                    Grade {grade.label}
                  </Badge>
                </div>
                <div className="mt-4 text-muted-foreground">
                  Score: {result.score} out of {result.total_marks}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span>{scorePercentage}%</span>
                </div>
                <Progress value={scorePercentage} className={`h-2 ${getProgressColor(scorePercentage)}`} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Subject</span>
                  </div>
                  <span>{result.exam.subject.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Date</span>
                  </div>
                  <span>{new Date(result.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>Status</span>
                  </div>
                  <Badge className={result.status === 'graded' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {result.status === 'graded' ? 'Graded' : 'Pending Review'}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/student/results">View All Results</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card md:col-span-2">
            <CardHeader>
              <CardTitle>{result.exam.title}</CardTitle>
              <CardDescription>
                {result.exam.class.name} | {result.exam.subject.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {result.feedback && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-700 mb-2">Teacher's Feedback</h3>
                  <p className="text-blue-600">{result.feedback}</p>
                </div>
              )}

              {questions.map((question, index) => {
                const userAnswer = result.answers?.[question.id];
                const isCorrect = question.type === 'multiple_choice' && userAnswer === question.correct_answer;
                
                let correctAnswerText = '';
                if (question.type === 'multiple_choice' && question.options) {
                  correctAnswerText = question.options.find(o => o.id === question.correct_answer)?.text || '';
                }
                
                let userAnswerText = '';
                if (question.type === 'multiple_choice' && question.options && userAnswer) {
                  userAnswerText = question.options.find(o => o.id === userAnswer)?.text || '';
                } else {
                  userAnswerText = userAnswer || '';
                }

                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">Question {index + 1}</div>
                      <Badge variant="outline">{question.marks} marks</Badge>
                    </div>
                    <p className="mt-2">{question.text}</p>
                    
                    {question.type === 'multiple_choice' && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Your Answer:</span>
                          <span className="flex items-center gap-1">
                            {userAnswerText}
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </span>
                        </div>
                        
                        {!isCorrect && question.correct_answer && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Correct Answer:</span>
                            <span className="text-green-600">{correctAnswerText}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {question.type === 'descriptive' && (
                      <div className="mt-4 space-y-2">
                        <span className="text-sm font-medium">Your Answer:</span>
                        <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                          {userAnswerText || <span className="text-muted-foreground italic">No answer provided</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExamResultDetails;
