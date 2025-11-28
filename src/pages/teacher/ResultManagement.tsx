
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SearchIcon, EyeIcon, PencilIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Subject {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  subject: { name: string };
  subject_id: string;
}

interface StudentResult {
  id: string;
  exam_id: string;
  student_id: string;
  student: { name: string; id: string };
  score: number;
  total_marks: number;
  status: 'pending' | 'reviewed' | 'graded';
  feedback: string | null;
  created_at: string;
}

const ResultManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Fetch subjects taught by this teacher
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setFetchError(null);
      
      try {
        console.log('Fetching subjects for teacher:', user.id);
        
        // Get teacher's assigned subject
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_details')
          .select('subject_id')
          .eq('user_id', user.id)
          .single();
        
        if (teacherError && teacherError.code !== 'PGSQL_ERROR') {
          console.error('Error fetching teacher details:', teacherError);
          throw teacherError;
        }
        
        // Get subject details
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name');
        
        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError);
          throw subjectsError;
        }
        
        console.log('Subjects data:', subjectsData);
        setSubjects(subjectsData || []);
        
        // Pre-select teacher's subject if they have one
        if (teacherData?.subject_id) {
          console.log('Pre-selecting subject:', teacherData.subject_id);
          setSubject(teacherData.subject_id);
        }
      } catch (error: any) {
        console.error('Error fetching subjects:', error);
        setFetchError(error.message || 'Failed to load subjects');
        toast.error('Failed to load subjects');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubjects();
  }, [user]);

  // Fetch exams based on selected subject
  useEffect(() => {
    const fetchExams = async () => {
      if (!user || !subject) return;
      
      setIsLoading(true);
      setSelectedExam('');
      setFetchError(null);
      
      try {
        console.log('Fetching exams for subject:', subject);
        
        const { data: examsData, error } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            subject_id,
            subject:subjects(name)
          `)
          .eq('created_by', user.id)
          .eq('subject_id', subject);
        
        if (error) {
          console.error('Error fetching exams:', error);
          throw error;
        }
        
        console.log('Exams data:', examsData);
        
        const formattedExams = (examsData || []).map(exam => ({
          id: exam.id,
          title: exam.title,
          subject: exam.subject || { name: 'Unknown' },
          subject_id: exam.subject_id
        }));
        
        setExams(formattedExams);
      } catch (error: any) {
        console.error('Error fetching exams:', error);
        setFetchError(error.message || 'Failed to load exams');
        toast.error('Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExams();
  }, [subject, user]);

  // Fetch student results for the selected exam
  useEffect(() => {
    const fetchStudentResults = async () => {
      if (!selectedExam) {
        setStudentResults([]);
        return;
      }
      
      setIsLoading(true);
      setFetchError(null);
      
      try {
        console.log('Fetching results for exam:', selectedExam);
        
        const { data, error } = await supabase
          .from('exam_results')
          .select(`
            id,
            exam_id,
            student_id,
            student:profiles!exam_results_student_id_fkey(id, name),
            score,
            total_marks,
            status,
            feedback,
            created_at
          `)
          .eq('exam_id', selectedExam);
        
        if (error) {
          console.error('Error fetching student results:', error);
          throw error;
        }
        
        console.log('Student results data:', data);
        
        // Cast the status to our expected type
        const typedResults = (data || []).map(result => ({
          ...result,
          status: (result.status === 'reviewed' || result.status === 'graded') 
            ? result.status as 'reviewed' | 'graded' | 'pending'
            : 'pending'
        }));
        
        setStudentResults(typedResults);
      } catch (error: any) {
        console.error('Error fetching student results:', error);
        setFetchError(error.message || 'Failed to load student results');
        toast.error('Failed to load student results');
        // If no results found, show an empty array
        setStudentResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentResults();
  }, [selectedExam]);

  // Filter student results based on search term
  const filteredResults = studentResults.filter(result => 
    result.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewResult = (result: StudentResult) => {
    setSelectedResult(result);
    setFeedback(result.feedback || '');
  };

  const handleSaveFeedback = async () => {
    if (!selectedResult) return;
    
    setIsSubmittingFeedback(true);
    
    try {
      console.log('Saving feedback for result:', selectedResult.id);
      
      const { error } = await supabase
        .from('exam_results')
        .update({
          feedback,
          status: 'reviewed',
          graded_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedResult.id);
      
      if (error) {
        console.error('Error saving feedback:', error);
        throw error;
      }
      
      console.log('Feedback saved successfully');
      
      // Update local state
      setStudentResults(prevResults => 
        prevResults.map(r => 
          r.id === selectedResult.id 
            ? { ...r, feedback, status: 'reviewed' } 
            : r
        )
      );
      
      toast.success('Feedback saved successfully');
      setSelectedResult(null);
      setFeedback('');
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback: ' + error.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleViewDetailedResult = (examId: string) => {
    navigate(`/teacher/results/${examId}`);
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Result Management</h1>
          <p className="text-muted-foreground">
            Review and grade student exam submissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Select Exam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subj => (
                      <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Exam</label>
                <Select 
                  value={selectedExam} 
                  onValueChange={setSelectedExam}
                  disabled={!subject || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoading 
                        ? "Loading exams..." 
                        : subject 
                          ? exams.length > 0 
                            ? "Select exam" 
                            : "No exams found for this subject" 
                          : "Select a subject first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Search Student</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!selectedExam || isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedResult ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Student</label>
                    <p>{selectedResult.student?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Score</label>
                    <p>{selectedResult.score}/{selectedResult.total_marks}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Feedback</label>
                  <Textarea 
                    placeholder="Enter your feedback for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedResult(null);
                      setFeedback('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveFeedback}
                    disabled={isSubmittingFeedback}
                  >
                    {isSubmittingFeedback && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {selectedExam && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              {selectedExam && (
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetailedResult(selectedExam)}
                  >
                    View Detailed Results
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : fetchError ? (
                <div className="text-center py-6 text-red-500">
                  <p>Error loading results: {fetchError}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length > 0 ? (
                      filteredResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.student?.name}</TableCell>
                          <TableCell>{result.score}/{result.total_marks}</TableCell>
                          <TableCell>
                            {result.status === 'reviewed' ? (
                              <Badge className="bg-green-500">Reviewed</Badge>
                            ) : (
                              <Badge className="bg-amber-500">Pending Review</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewResult(result)}
                              >
                                {result.status === 'reviewed' ? (
                                  <EyeIcon className="h-4 w-4" />
                                ) : (
                                  <PencilIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          {searchTerm 
                            ? "No students found matching your search criteria." 
                            : "No student results available for this exam."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResultManagement;
