import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle, BookOpen, Clock, CalendarIcon, Plus, Minus, Save, AlertTriangle, Loader2, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  subject_id: string;
  marks: number;
  options: any;
  correct_answer: string;
  subject?: string;
  difficulty?: string;
}

const CreateExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('60');
  const [examDate, setExamDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>([
    'Read all questions carefully before answering.',
    'All multiple-choice questions have only one correct answer.',
    'Each question is marked according to its difficulty level.',
    'You can navigate between questions using the Next and Previous buttons.'
  ]);
  const [newInstruction, setNewInstruction] = useState('');
  const [filter, setFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [randomSelectionMarks, setRandomSelectionMarks] = useState('100');
  const [randomSelectionDialogOpen, setRandomSelectionDialogOpen] = useState(false);
  const [isRandomSelecting, setIsRandomSelecting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      toast.error('Only teachers can create exams');
      navigate('/');
    }
  }, [user, navigate]);

  const { 
    data: subjectsData,
    isLoading: isLoadingSubjects 
  } = useSupabaseQuery<Subject>({
    tableName: 'subjects',
    columns: 'id, name',
  });

  const { 
    data: classesData,
    isLoading: isLoadingClasses 
  } = useSupabaseQuery<Class>({
    tableName: 'classes',
    columns: 'id, name',
  });

  const { 
    data: questionsData,
    isLoading: isLoadingQuestions 
  } = useSupabaseQuery<Question>({
    tableName: 'questions',
    columns: 'id, text, type, subject_id, marks, options, correct_answer',
    filters: subjectFilter ? [{ column: 'subject_id', operator: 'eq', value: subjectFilter }] : [],
  });

  const { insert: insertExam, isLoading: isInsertingExam } = useSupabaseMutation('exams');

  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (questionsData && subjectsData) {
      const mappedQuestions = questionsData.map(question => {
        const subjectObj = subjectsData.find((s: Subject) => s.id === question.subject_id);
        return {
          ...question,
          subject: subjectObj ? subjectObj.name : 'Unknown Subject',
          difficulty: 'medium',
        };
      });
      setQuestions(mappedQuestions);
    }
  }, [questionsData, subjectsData]);

  const filteredQuestions = questions.filter(q => {
    const matchesFilter = !filter || 
                          q.text.toLowerCase().includes(filter.toLowerCase()) ||
                          (q.subject && q.subject.toLowerCase().includes(filter.toLowerCase())) ||
                          q.type.toLowerCase().includes(filter.toLowerCase());
    
    const matchesSubject = !subjectFilter || q.subject_id === subjectFilter;
    
    return matchesFilter && matchesSubject;
  });

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const toggleQuestionSelection = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const calculateTotalMarks = () => {
    return questions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((sum, q) => sum + q.marks, 0);
  };

  const handleClassToggle = (classId: string) => {
    if (classes.includes(classId)) {
      setClasses(classes.filter(c => c !== classId));
    } else {
      setClasses([...classes, classId]);
    }
  };

  const handleSaveExam = async () => {
    if (!title || !subject || !duration || !examDate || !startTime || classes.length === 0 || selectedQuestions.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create an exam');
      return;
    }

    setIsSaving(true);

    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(examDate);
      startDateTime.setHours(hours, minutes);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

      const examData = {
        title,
        description,
        subject_id: subject,
        class_id: classes[0],
        duration: parseInt(duration),
        total_marks: calculateTotalMarks(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        created_by: user.id,
        status: 'scheduled'
      };

      const result = await insertExam(examData);
      
      if (result) {
        const examId = Array.isArray(result) ? result[0].id : result.id;
        
        const examQuestions = selectedQuestions.map(questionId => ({
          exam_id: examId,
          question_id: questionId
        }));
        
        const { error } = await supabase
          .from('exam_questions')
          .insert(examQuestions);
          
        if (error) {
          console.error('Error linking questions:', error);
          toast.error(`Error linking questions: ${error.message}`);
          return;
        }

        toast.success('Exam created successfully');
        navigate('/teacher/exams');
      } else {
        throw new Error('Failed to create exam');
      }
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error(`Failed to create exam: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRandomSelection = async () => {
    if (!subject) {
      toast.error('Please select a subject first');
      return;
    }

    const maxMarks = parseInt(randomSelectionMarks);
    if (isNaN(maxMarks) || maxMarks <= 0) {
      toast.error('Please enter a valid number for total marks');
      return;
    }

    setIsRandomSelecting(true);

    try {
      const availableQuestions = questions.filter(q => q.subject_id === subject);

      if (availableQuestions.length === 0) {
        toast.error('No questions found for the selected subject');
        setIsRandomSelecting(false);
        return;
      }

      const shuffledQuestions = [...availableQuestions].sort(() => Math.random() - 0.5);
      
      let selectedIds: string[] = [];
      let currentTotalMarks = 0;
      
      for (const question of shuffledQuestions) {
        if (currentTotalMarks + question.marks <= maxMarks) {
          selectedIds.push(question.id);
          currentTotalMarks += question.marks;
          
          if (currentTotalMarks === maxMarks) {
            break;
          }
        }
      }
      
      if (selectedIds.length === 0) {
        const lowestMarksQuestion = shuffledQuestions.reduce((prev, current) => 
          (prev.marks < current.marks) ? prev : current, 
          shuffledQuestions[0]
        );
        
        if (lowestMarksQuestion) {
          selectedIds.push(lowestMarksQuestion.id);
          currentTotalMarks = lowestMarksQuestion.marks;
        }
      }
      
      if (selectedIds.length === 0) {
        toast.error('Could not find suitable questions within the marks limit');
      } else {
        setSelectedQuestions(selectedIds);
        toast.success(`Selected ${selectedIds.length} questions with total marks: ${currentTotalMarks}`);
      }
    } catch (error) {
      console.error('Error during random selection:', error);
      toast.error('Failed to randomly select questions');
    } finally {
      setIsRandomSelecting(false);
      setRandomSelectionDialogOpen(false);
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-muted-foreground">
            Design a new exam by selecting questions from your question bank
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>Enter basic information about the exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Mathematics Mid-Term Exam"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the exam"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  {isLoadingSubjects ? (
                    <div className="flex items-center space-x-2 p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading subjects...</span>
                    </div>
                  ) : (
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsData?.map((subj: Subject) => (
                          <SelectItem key={subj.id} value={subj.id}>
                            {subj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g. 60"
                      min="5"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalMarks">Total Marks</Label>
                    <Input
                      id="totalMarks"
                      readOnly
                      value={calculateTotalMarks().toString()}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !examDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {examDate ? format(examDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={examDate}
                          onSelect={setExamDate}
                          initialFocus
                          className="p-3"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Assign to Classes</Label>
                  {isLoadingClasses ? (
                    <div className="flex items-center space-x-2 p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading classes...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {classesData?.map((classItem: Class) => (
                        <div key={classItem.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${classItem.id}`}
                            checked={classes.includes(classItem.id)}
                            onCheckedChange={() => handleClassToggle(classItem.id)}
                          />
                          <Label htmlFor={`class-${classItem.id}`} className="cursor-pointer">
                            {classItem.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Exam Instructions</CardTitle>
                <CardDescription>Add instructions for students taking the exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-1 p-2 bg-secondary/50 rounded-md">
                        {instruction}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleRemoveInstruction(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Add a new instruction..."
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInstruction()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddInstruction}
                    disabled={!newInstruction.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Select Questions</CardTitle>
                    <CardDescription>Choose questions from your question bank</CardDescription>
                  </div>
                  <Dialog open={randomSelectionDialogOpen} onOpenChange={setRandomSelectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={!subject}>
                        <Shuffle className="mr-2 h-4 w-4" />
                        Random Selection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Random Question Selection</DialogTitle>
                        <DialogDescription>
                          Select random questions from the question bank for this subject
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="total-marks">Maximum Total Marks</Label>
                          <Input
                            id="total-marks"
                            type="number"
                            min="1"
                            placeholder="e.g. 100"
                            value={randomSelectionMarks}
                            onChange={(e) => setRandomSelectionMarks(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            The system will select questions with a total of approximately {randomSelectionMarks} marks or less
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRandomSelectionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRandomSelection} disabled={isRandomSelecting}>
                          {isRandomSelecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Selecting...
                            </>
                          ) : (
                            <>
                              <Shuffle className="mr-2 h-4 w-4" />
                              Select Random Questions
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search questions..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  {isLoadingSubjects ? (
                    <div className="w-[180px] flex items-center justify-center p-2 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-subjects" value="all-subjects-filter">All Subjects</SelectItem>
                        {subjectsData?.map((subj: Subject) => (
                          <SelectItem key={subj.id} value={subj.id}>
                            {subj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-700">Note</p>
                    <p className="text-yellow-600">
                      Selected questions: {selectedQuestions.length} | 
                      Total marks: {calculateTotalMarks()}
                    </p>
                  </div>
                </div>
                
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading questions...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((question) => (
                        <div
                          key={question.id}
                          className={`p-3 border rounded-md transition-colors ${
                            selectedQuestions.includes(question.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`question-${question.id}`}
                              checked={selectedQuestions.includes(question.id)}
                              onCheckedChange={() => toggleQuestionSelection(question.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {question.type === 'mcq' ? (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                ) : (
                                  <BookOpen className="h-4 w-4 text-primary" />
                                )}
                                <span className="text-xs font-medium">
                                  {question.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                  {question.subject}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                  {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                </span>
                              </div>
                              <Label
                                htmlFor={`question-${question.id}`}
                                className="cursor-pointer whitespace-pre-line"
                              >
                                {question.text}
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No questions found. Try adjusting your filters.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>
                  Review your exam details before creating it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Subject:</span>
                      <span className="text-sm font-medium">
                        {subject ? subjectsData?.find((s: Subject) => s.id === subject)?.name || 'Loading...' : 'Not selected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span className="text-sm font-medium">{duration || '0'} minutes</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Questions:</span>
                      <span className="text-sm font-medium">{selectedQuestions.length}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Date:</span>
                      <span className="text-sm font-medium">
                        {examDate ? format(examDate, "PP") : 'Not selected'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedQuestions.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        No questions selected. Please select at least one question.
                      </p>
                    </div>
                  )}
                  
                  {classes.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        No classes assigned. Please select at least one class.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveExam}
                  className="w-full shadow-button"
                  disabled={!title || !subject || !duration || !examDate || !startTime || classes.length === 0 || selectedQuestions.length === 0 || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Exam...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Exam
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateExam;

