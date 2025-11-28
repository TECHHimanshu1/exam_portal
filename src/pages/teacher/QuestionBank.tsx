import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Question, QuestionOptionsType, QuestionForm } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

const defaultQuestion: QuestionForm = {
  text: '',
  type: 'mcq',
  marks: 1,
  options: ['', '', '', ''],
  correctAnswer: '',
  subject: '',
};

const QuestionBank = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'mcq' | 'descriptive'>('mcq');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(defaultQuestion);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Fetch subjects and questions
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Get subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');
          
        if (subjectsError) {
          throw subjectsError;
        }
        
        setSubjects(subjectsData || []);
        
        // Get teacher's assigned subject
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_details')
          .select('subject_id')
          .eq('user_id', user.id)
          .single();
          
        if (teacherData?.subject_id) {
          setSelectedSubject(teacherData.subject_id);
        } else if (subjectsData && subjectsData.length > 0) {
          setSelectedSubject(subjectsData[0].id);
        }
        
        // Fetch questions
        await fetchQuestions(selectedSubject || teacherData?.subject_id || (subjectsData && subjectsData.length > 0 ? subjectsData[0].id : ''));
      } catch (error) {
        console.error('Error loading question bank data:', error);
        toast.error('Failed to load question bank');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Fetch questions on subject change
  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchQuestions = async (subjectId: string) => {
    if (!subjectId || !user?.id) return;
    
    setIsLoading(true);
    
    try {
      console.log(`Fetching questions for subject ${subjectId} and user ${user.id}`);
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          type,
          marks,
          options,
          correct_answer,
          created_by,
          subject_id,
          subject:subject_id(name)
        `)
        .eq('created_by', user.id)
        .eq('subject_id', subjectId);
        
      if (error) {
        throw error;
      }
      
      console.log('Questions data:', data);
      
      // Map database question format to our app's Question type
      const mappedQuestions: Question[] = (data || []).map(q => {
        // Ensure type is one of the allowed values
        const questionType: 'mcq' | 'descriptive' = 
          q.type === 'mcq' ? 'mcq' : 'descriptive';
          
        // Parse options based on their type
        let parsedOptions: QuestionOptionsType = [];
        
        if (q.options) {
          if (typeof q.options === 'string') {
            try {
              parsedOptions = JSON.parse(q.options);
            } catch (e) {
              console.error('Error parsing options:', e);
            }
          } else {
            parsedOptions = q.options as QuestionOptionsType;
          }
        }
        
        return {
          id: q.id,
          text: q.text,
          type: questionType,
          marks: q.marks,
          options: parsedOptions,
          correctAnswer: q.correct_answer || '',
          subject: q.subject_id,
          difficulty: 'medium', // Default value since not in DB
        };
      });
      
      setQuestions(mappedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      ...defaultQuestion,
      subject: selectedSubject,
    });
    setDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question.id);
    
    // Convert the question options to string array format for the form
    let optionsArray: string[] = ['', '', '', ''];
    
    if (question.options) {
      if (Array.isArray(question.options)) {
        // Handle both string[] and QuestionOption[]
        if (typeof question.options[0] === 'string') {
          optionsArray = question.options as string[];
        } else {
          // Convert QuestionOption[] to string[]
          optionsArray = (question.options as { id: string; text: string }[]).map(opt => opt.text);
        }
      } else if (typeof question.options === 'object') {
        // Handle QuestionOptionsMap (convert object to array)
        optionsArray = Object.values(question.options);
      }
    }
    
    // Ensure we have at least 4 options for the form
    while (optionsArray.length < 4) {
      optionsArray.push('');
    }
    
    setQuestionForm({
      text: question.text,
      type: question.type,
      marks: question.marks,
      options: optionsArray,
      correctAnswer: question.correctAnswer?.toString() || '',
      subject: question.subject || selectedSubject,
    });
    
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionToDelete);
        
      if (error) {
        throw error;
      }
      
      setQuestions(questions.filter(q => q.id !== questionToDelete));
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const handleSaveQuestion = async () => {
    // Validate form
    if (!questionForm.text) {
      toast.error('Question text is required');
      return;
    }
    
    if (!questionForm.subject) {
      toast.error('Subject is required');
      return;
    }
    
    if (questionForm.type === 'mcq') {
      const emptyOptions = questionForm.options.filter(opt => !opt.trim()).length;
      if (emptyOptions > 0) {
        toast.error('All options must be filled');
        return;
      }
      
      if (!questionForm.correctAnswer) {
        toast.error('Correct answer must be selected');
        return;
      }
    }
    
    if (!user?.id) {
      toast.error('You must be logged in to save questions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Saving question with user ID:', user.id);
      
      const questionData = {
        text: questionForm.text,
        type: questionForm.type,
        marks: questionForm.marks,
        options: questionForm.type === 'mcq' ? questionForm.options : null,
        correct_answer: questionForm.type === 'mcq' ? questionForm.correctAnswer : null,
        subject_id: questionForm.subject || selectedSubject,
        created_by: user.id,
      };
      
      console.log('Question data being saved:', questionData);
      
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion);
          
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        toast.success('Question updated successfully');
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select();
          
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        console.log('Created question:', data);
        toast.success('Question added successfully');
      }
      
      // Refresh questions
      await fetchQuestions(questionForm.subject || selectedSubject);
      
      // Reset form and close dialog
      setDialogOpen(false);
      setQuestionForm(defaultQuestion);
      setEditingQuestion(null);
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error(`Failed to save question: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions based on search term and question type
  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) && 
    q.type === selectedTab
  );

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-muted-foreground">
              Manage your questions for exams
            </p>
          </div>
          <Button 
            onClick={handleAddNewQuestion} 
            className="hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Filter Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search">Search Questions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by question text..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'mcq' | 'descriptive')}>
          <TabsList className="grid w-full md:w-80 grid-cols-2">
            <TabsTrigger value="mcq">Multiple Choice</TabsTrigger>
            <TabsTrigger value="descriptive">Descriptive</TabsTrigger>
          </TabsList>
          <TabsContent value="mcq">
            <Card className="glass-card">
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.text}</TableCell>
                          <TableCell>{question.marks}</TableCell>
                          <TableCell className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setQuestionToDelete(question.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          {searchTerm 
                            ? "No questions found matching your search criteria." 
                            : "No multiple choice questions in this subject yet."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="descriptive">
            <Card className="glass-card">
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.text}</TableCell>
                          <TableCell>{question.marks}</TableCell>
                          <TableCell className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setQuestionToDelete(question.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          {searchTerm 
                            ? "No questions found matching your search criteria." 
                            : "No descriptive questions in this subject yet."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Question Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion 
                  ? 'Make changes to the existing question'
                  : 'Create a new question for your exams'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="question-text">Question Text</Label>
                  <Textarea
                    id="question-text"
                    placeholder="Enter your question here..."
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="question-type">Question Type</Label>
                    <Select
                      value={questionForm.type}
                      onValueChange={(value) => setQuestionForm({...questionForm, type: value as 'mcq' | 'descriptive'})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="descriptive">Descriptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="question-marks">Marks</Label>
                    <Input
                      id="question-marks"
                      type="number"
                      min={1}
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({...questionForm, marks: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
              </div>

              {questionForm.type === 'mcq' && (
                <div className="space-y-4">
                  <Label>Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`correct-${index}`}
                            name="correct-answer"
                            value={index.toString()}
                            checked={questionForm.correctAnswer === index.toString()}
                            onChange={() => setQuestionForm({...questionForm, correctAnswer: index.toString()})}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          />
                          <Label htmlFor={`correct-${index}`} className="text-sm">Correct</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveQuestion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Question'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Question'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default QuestionBank;
