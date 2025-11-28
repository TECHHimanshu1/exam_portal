
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, AlertTriangle, CheckCircle, Shield, FileQuestion, FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Question, QuestionOption, QuestionOptionsMap, QuestionOptionsType } from '@/types';
import { Json } from '@/integrations/supabase/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useExamQuestions } from '@/hooks/useExamQuestions';

interface ExamData {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_marks: number;
  status: string;
  subject: { name: string };
  class: { name: string };
}

const TakeExam = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isTimeWarningDialogOpen, setIsTimeWarningDialogOpen] = useState(false);
  const [isExamAccessDenied, setIsExamAccessDenied] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState('');
  
  const { questions, isLoading: isQuestionsLoading, error: questionLoadError } = useExamQuestions(id);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchExamData();
  }, [id, user, navigate]);
  
  const fetchExamData = async () => {
    setIsLoading(true);
    try {
      // First check if student has already attempted this exam
      const { data: existingResult, error: resultError } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_id', id)
        .eq('student_id', user?.id)
        .maybeSingle();
      
      if (resultError) {
        console.error('Error checking existing result:', resultError);
      }
      
      if (existingResult) {
        setIsExamAccessDenied(true);
        setAccessDeniedReason('You have already attempted this exam. You can only take an exam once.');
        setIsLoading(false);
        return;
      }
      
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select(`
          id, 
          title, 
          description, 
          duration, 
          total_marks,
          status,
          subject:subjects(name),
          class:classes(name)
        `)
        .eq('id', id)
        .single();
      
      if (examError) throw examError;
      
      if (exam.status !== 'active') {
        setIsExamAccessDenied(true);
        setAccessDeniedReason(`This exam is not active yet. Current status: ${exam.status}`);
        setIsLoading(false);
        return;
      }
      
      setExamData(exam);
      setTimeLeft(exam.duration * 60);
    } catch (error: any) {
      console.error('Error fetching exam data:', error);
      toast.error(error.message || 'Failed to load exam');
      navigate('/student/exams');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (timeLeft <= 0 && !isLoading && examData && !isExamAccessDenied) {
      handleSubmit();
      return;
    }
    
    if (timeLeft === 300) { // 5 minutes warning
      setIsTimeWarningDialogOpen(true);
    }
    
    const timer = timeLeft > 0 && !isLoading && !isExamAccessDenied ? 
      setInterval(() => setTimeLeft(time => time - 1), 1000) : 
      undefined;
      
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft, isLoading, examData, isExamAccessDenied]);
  
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const moveToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsSubmitDialogOpen(false);
    setIsTimeWarningDialogOpen(false);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log('Submitting exam with user ID:', user.id);
      
      let score = 0;
      let total_marks = 0;
      const answersObject: Record<string, string> = {};
      
      questions.forEach(question => {
        total_marks += question.marks;
        const userAnswer = answers[question.id] || '';
        answersObject[question.id] = userAnswer;
        
        if (question.type === 'mcq' && question.correctAnswer && userAnswer === question.correctAnswer) {
          score += question.marks;
        }
      });
      
      console.log('Calculated score:', score);
      console.log('Total marks:', total_marks);
      console.log('Answers object:', answersObject);
      console.log('Student ID:', user.id);
      console.log('Exam ID:', id);
      
      // Create the exam result
      const { data, error } = await supabase
        .from('exam_results')
        .insert({
          exam_id: id,
          student_id: user.id,
          score: score,
          total_marks: total_marks,
          status: questions.some(q => q.type === 'descriptive') ? 'pending' : 'graded',
          answers: answersObject
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Exam submitted successfully:', data);
      toast.success('Exam submitted successfully!');
      navigate(`/student/results/${data.id}`);
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      toast.error(error.message || 'Failed to submit exam');
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  if (isExamAccessDenied) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-center mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-center mb-6">{accessDeniedReason}</p>
          
          {accessDeniedReason.includes("already attempted") && (
            <div className="flex flex-col items-center mb-6">
              <FileCheck className="h-12 w-12 text-green-500 mb-2" />
              <p className="text-center font-medium text-green-600">
                You have already completed this exam. Check your results page to see your performance.
              </p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button onClick={() => navigate('/student/exams')} variant="outline">
              Return to Exam List
            </Button>
            
            {accessDeniedReason.includes("already attempted") && (
              <Button onClick={() => navigate('/student/results')} variant="default">
                View Results
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? 
    Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;
  
  const renderOptions = (question: Question) => {
    if (!question.options) return null;
    
    const options = question.options;
    
    if (Array.isArray(options)) {
      return options.map((option, index) => {
        const optionId = typeof option === 'string' ? String(index) : option.id;
        const optionText = typeof option === 'string' ? option : option.text;
        
        return (
          <div key={optionId} className="flex items-center space-x-2">
            <RadioGroupItem value={optionId} id={`option-${question.id}-${optionId}`} />
            <Label htmlFor={`option-${question.id}-${optionId}`} className="cursor-pointer">
              {optionText}
            </Label>
          </div>
        );
      });
    } else if (typeof options === 'object') {
      return Object.entries(options).map(([key, value]) => (
        <div key={key} className="flex items-center space-x-2">
          <RadioGroupItem value={key} id={`option-${question.id}-${key}`} />
          <Label htmlFor={`option-${question.id}-${key}`} className="cursor-pointer">
            {String(value)}
          </Label>
        </div>
      ));
    }
    
    return null;
  };
  
  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{examData?.title}</h1>
                <p className="text-muted-foreground">{examData?.subject?.name} | {examData?.class?.name}</p>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-xl">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            
            {questionLoadError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Questions</AlertTitle>
                <AlertDescription>{questionLoadError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-6 md:grid-cols-12">
              <Card className="glass-card md:col-span-9">
                {isQuestionsLoading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Loading exam questions...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <FileQuestion className="h-16 w-16 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
                    <p className="text-muted-foreground text-center mb-6">
                      {questionLoadError ? 
                        questionLoadError : 
                        "This exam doesn't have any questions yet. Please contact your teacher."}
                    </p>
                    <Button onClick={() => navigate('/student/exams')}>
                      Return to Exam List
                    </Button>
                  </div>
                ) : currentQuestion ? (
                  <>
                    <CardHeader>
                      <CardTitle className="flex justify-between">
                        <div>Question {currentQuestionIndex + 1}</div>
                        <div className="text-muted-foreground font-normal text-sm">
                          Marks: {currentQuestion.marks}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="text-lg">{currentQuestion.text}</div>
                      
                      {currentQuestion.type === 'mcq' && (
                        <RadioGroup
                          value={answers[currentQuestion.id] || ''}
                          onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                          className="space-y-3"
                        >
                          {renderOptions(currentQuestion)}
                        </RadioGroup>
                      )}
                      
                      {currentQuestion.type === 'descriptive' && (
                        <Textarea
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          placeholder="Enter your answer here..."
                          className="min-h-[150px]"
                        />
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => moveToQuestion(currentQuestionIndex - 1)}
                        disabled={currentQuestionIndex === 0}
                      >
                        Previous
                      </Button>
                      
                      {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                          onClick={() => moveToQuestion(currentQuestionIndex + 1)}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button 
                          variant="default"
                          onClick={() => setIsSubmitDialogOpen(true)}
                        >
                          Submit Exam
                        </Button>
                      )}
                    </CardFooter>
                  </>
                ) : null}
              </Card>
              
              <div className="md:col-span-3 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, index) => (
                        <Button
                          key={index}
                          variant={currentQuestionIndex === index ? "default" : 
                            answers[questions[index].id] ? "outline" : "secondary"}
                          className={`h-10 w-10 p-0 ${currentQuestionIndex === index ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => moveToQuestion(index)}
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="secondary"
                      className="w-full"
                      onClick={() => setIsSubmitDialogOpen(true)}
                    >
                      Submit Exam
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((question, index) => (
                          <TableRow 
                            key={question.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => moveToQuestion(index)}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{question.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'}</TableCell>
                            <TableCell className="text-right">
                              {answers[question.id] ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Answered
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Unanswered
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
      
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your exam? You won't be able to change your answers afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Exam
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isTimeWarningDialogOpen} onOpenChange={setIsTimeWarningDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Time Running Out
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have less than 5 minutes remaining to complete the exam. Please finish and submit your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TakeExam;
