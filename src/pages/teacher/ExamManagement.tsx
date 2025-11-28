
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, EditIcon, TrashIcon, EyeIcon, FilterIcon, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatabaseExam } from '@/types';

interface Exam {
  id: string;
  title: string;
  subject: { name: string } | null;
  subject_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  duration: number;
  status: string;
  questionCount: number;
}

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusConfirmDialogOpen, setStatusConfirmDialogOpen] = useState(false);
  const [statusChangeDetails, setStatusChangeDetails] = useState<{examId: string, newStatus: string, examTitle: string} | null>(null);
  
  // Get mutation functions
  const { remove: removeExam, update: updateExam } = useSupabaseMutation('exams');
  
  useEffect(() => {
    if (user) {
      fetchExams();
    }
  }, [user]);
  
  const fetchExams = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get exams created by this teacher
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          subject_id,
          subject:subjects(name),
          duration,
          start_time,
          end_time,
          status
        `)
        .eq('created_by', user.id);
      
      if (examsError) {
        throw examsError;
      }
      
      // For each exam, get the count of questions
      const examsWithQuestionCount = await Promise.all(
        (examsData || []).map(async (exam) => {
          const { count, error: countError } = await supabase
            .from('exam_questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);
            
          if (countError) {
            console.error('Error counting questions:', countError);
          }
          
          return {
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            subject_id: exam.subject_id,
            date: format(parseISO(exam.start_time), 'yyyy-MM-dd'),
            start_time: exam.start_time,
            end_time: exam.end_time,
            duration: exam.duration,
            status: exam.status,
            questionCount: count || 0
          };
        })
      );
      
      setExams(examsWithQuestionCount);
      setFilteredExams(examsWithQuestionCount);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters whenever the search query or status filter changes
    let filtered = exams;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }
    
    setFilteredExams(filtered);
  }, [searchQuery, statusFilter, exams]);

  const confirmDeleteExam = (id: string) => {
    setExamToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const deleteExam = async () => {
    if (!examToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // First delete related exam questions
      const { error: questionsError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examToDelete);
      
      if (questionsError) {
        throw questionsError;
      }
      
      // Then delete the exam
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete);

      if (examError) {
        throw examError;
      }
      
      // Update local state
      setExams(exams.filter(exam => exam.id !== examToDelete));
      setFilteredExams(filteredExams.filter(exam => exam.id !== examToDelete));
      toast.success('Exam deleted successfully');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    } finally {
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
      setIsDeleting(false);
    }
  };

  const confirmStatusChange = (examId: string, newStatus: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    setStatusChangeDetails({
      examId,
      newStatus,
      examTitle: exam.title
    });
    setStatusConfirmDialogOpen(true);
  };

  const updateExamStatus = async (examId: string, newStatus: string) => {
    setIsStatusUpdating(true);
    
    try {
      // Check if exam has any questions before activating
      if (newStatus === 'active') {
        const exam = exams.find(e => e.id === examId);
        if (!exam || exam.questionCount === 0) {
          toast.error('Cannot activate an exam with no questions');
          return;
        }
      }
      
      const { error } = await supabase
        .from('exams')
        .update({ status: newStatus })
        .eq('id', examId);
      
      if (error) throw error;
      
      // Update local state
      const updatedExams = exams.map(exam => 
        exam.id === examId ? { ...exam, status: newStatus } : exam
      );
      
      setExams(updatedExams);
      setFilteredExams(updatedExams.filter(exam => 
        statusFilter === 'all' || exam.status === statusFilter
      ));
      
      toast.success(`Exam status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating exam status:', error);
      toast.error(`Failed to update exam status: ${error.message}`);
    } finally {
      setIsStatusUpdating(false);
      setStatusConfirmDialogOpen(false);
    }
  };

  // Note: We're removing the auto-update function as requested
  // No automatic status changes will occur anymore

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500">Draft</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return ['scheduled'];
      case 'scheduled':
        return ['active', 'draft'];
      case 'active':
        return ['completed'];
      case 'completed':
        return [];
      default:
        return [];
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
            <p className="text-muted-foreground">
              Create, schedule, and manage your exams
            </p>
          </div>
          <ButtonLink 
            to="/teacher/exams/create"
            className="shadow-button"
          >
            Create New Exam
          </ButtonLink>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle>Your Exams</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <div className="flex items-center">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="All status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration (mins)</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.subject?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              {exam.date}
                            </div>
                          </TableCell>
                          <TableCell>{exam.duration}</TableCell>
                          <TableCell>
                            {exam.questionCount === 0 ? (
                              <span className="text-red-500">No questions</span>
                            ) : (
                              exam.questionCount
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(exam.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => confirmDeleteExam(exam.id)}
                                disabled={exam.status === 'active'}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                              {getAvailableStatusOptions(exam.status).length > 0 && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm">
                                      Change Status
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {getAvailableStatusOptions(exam.status).map(status => (
                                      <DropdownMenuItem
                                        key={status}
                                        onClick={() => confirmStatusChange(exam.id, status)}
                                      >
                                        Set to {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery || statusFilter !== 'all' 
                            ? 'No exams found matching your filters.' 
                            : 'No exams found. Create your first exam using the button above.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between flex-row">
            <div className="text-sm text-muted-foreground">
              Showing {filteredExams.length} of {exams.length} exams
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteExam}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={statusConfirmDialogOpen} onOpenChange={setStatusConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {statusChangeDetails && (
                <>
                  Are you sure you want to change the status of "{statusChangeDetails.examTitle}" 
                  to <strong>{statusChangeDetails.newStatus}</strong>?
                  {statusChangeDetails.newStatus === 'completed' && (
                    <p className="mt-2 text-yellow-600">
                      Warning: Students will no longer be able to take this exam once it's marked as completed.
                    </p>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => statusChangeDetails && updateExamStatus(statusChangeDetails.examId, statusChangeDetails.newStatus)}
              disabled={isStatusUpdating}
            >
              {isStatusUpdating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExamManagement;
