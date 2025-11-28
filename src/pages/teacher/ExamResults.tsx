
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Users, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ExamResults = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [examDetails, setExamDetails] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      toast.error('Only teachers can access this page');
      navigate('/');
    } else if (examId) {
      fetchExamDetails();
      fetchExamResults();
    }
  }, [examId, user, navigate]);

  const fetchExamDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          subject:subjects(name),
          class:classes(name),
          duration,
          total_marks,
          status
        `)
        .eq('id', examId)
        .single();

      if (error) throw error;
      setExamDetails(data);
    } catch (error: any) {
      console.error('Error fetching exam details:', error);
      toast.error(`Failed to load exam details: ${error.message}`);
    }
  };

  const fetchExamResults = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching results for exam:', examId);
      
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
          student:profiles!exam_results_student_id_fkey(id, name, email)
        `)
        .eq('exam_id', examId);

      if (error) throw error;
      console.log('Student results data:', data);
      setResults(data || []);
    } catch (error: any) {
      console.error('Error fetching exam results:', error);
      toast.error(`Failed to load exam results: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = (result: any) => {
    setSelectedResult(result);
    setFeedback(result.feedback || '');
    setGrade(result.score.toString());
  };

  const handleSaveFeedback = async () => {
    if (!selectedResult) return;

    setIsSaving(true);
    try {
      const scoreNum = parseInt(grade);
      if (isNaN(scoreNum)) {
        toast.error('Please enter a valid score');
        return;
      }

      const { error } = await supabase
        .from('exam_results')
        .update({
          feedback,
          score: scoreNum,
          status: 'graded',
          graded_by: user?.id
        })
        .eq('id', selectedResult.id);

      if (error) throw error;

      toast.success('Feedback and grade saved successfully');
      
      // Update the local state to reflect the changes
      const updatedResults = results.map(result => 
        result.id === selectedResult.id 
          ? { ...result, feedback, score: scoreNum, status: 'graded' } 
          : result
      );
      
      setResults(updatedResults);
      setSelectedResult(prev => prev ? { ...prev, feedback, score: scoreNum, status: 'graded' } : null);
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      toast.error(`Failed to save feedback: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/teacher/exams')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Exam Details</CardTitle>
                  <CardDescription>Summary of the exam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {examDetails ? (
                    <>
                      <div>
                        <h3 className="font-medium">{examDetails.title}</h3>
                        <p className="text-sm text-muted-foreground">{examDetails.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subject:</span>
                          <p>{examDetails.subject?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <p>{examDetails.class?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p>{examDetails.duration} minutes</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Marks:</span>
                          <p>{examDetails.total_marks}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={
                            examDetails.status === 'completed' ? 'bg-green-500' : 
                            examDetails.status === 'active' ? 'bg-blue-500' : 
                            'bg-yellow-500'
                          }>
                            {examDetails.status.charAt(0).toUpperCase() + examDetails.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Results Summary:</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Total Students:</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {results.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Graded:</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {results.filter(r => r.status === 'graded').length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Pending:</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {results.filter(r => r.status === 'pending').length}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No exam details available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Student Results</CardTitle>
                  <CardDescription>Select a student to grade</CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {results.map((result) => (
                        <div
                          key={result.id}
                          className={`p-3 border rounded-md transition-colors cursor-pointer ${
                            selectedResult?.id === result.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-secondary/50'
                          }`}
                          onClick={() => handleSelectResult(result)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{result.student?.name}</p>
                              <p className="text-xs text-muted-foreground">{result.student?.email}</p>
                            </div>
                            <Badge className={
                              result.status === 'graded' ? 'bg-green-500' : 'bg-yellow-500'
                            }>
                              {result.status}
                            </Badge>
                          </div>
                          <div className="mt-2 flex justify-between text-sm">
                            <span>Score: {result.score} / {result.total_marks}</span>
                            <span>{Math.round((result.score / result.total_marks) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">No results available yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Student Assessment</CardTitle>
                  <CardDescription>
                    {selectedResult 
                      ? `Grading for ${selectedResult.student?.name}`
                      : 'Select a student from the list to grade their exam'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedResult ? (
                    <Tabs defaultValue="feedback">
                      <TabsList className="mb-4">
                        <TabsTrigger value="feedback">Feedback & Grading</TabsTrigger>
                        <TabsTrigger value="answers">Student Answers</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="feedback" className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="grade">Score</Label>
                            <span className="text-sm text-muted-foreground">
                              Out of {selectedResult.total_marks}
                            </span>
                          </div>
                          <Input
                            id="grade"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            type="number"
                            min="0"
                            max={selectedResult.total_marks}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="feedback">Teacher's Feedback</Label>
                          <Textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide feedback on the student's performance..."
                            rows={6}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSaveFeedback} 
                          className="w-full"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback & Grade'
                          )}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="answers">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                          <p className="text-yellow-700 text-sm">
                            Note: In the future, this section will display all of the student's answers for manual grading of descriptive questions.
                          </p>
                        </div>
                        
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Student answers view is coming soon</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Select a student from the list to view and grade their exam</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedResult 
                      ? `Last updated: ${new Date(selectedResult.updated_at).toLocaleString()}`
                      : ''}
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamResults;
