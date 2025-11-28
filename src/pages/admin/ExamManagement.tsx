
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Exam } from '@/types';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ButtonLink } from '@/components/ui/button-link';

const ExamManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration,
          start_time,
          end_time,
          status,
          total_marks,
          subject_id (id, name),
          class_id (id, name),
          created_by (id, name)
        `);
        
      if (error) throw error;
      
      return data.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject_id?.name || 'Unknown',
        subjectId: exam.subject_id?.id,
        class: exam.class_id?.name || 'Unknown',
        classId: exam.class_id?.id,
        duration: exam.duration,
        totalMarks: exam.total_marks,
        startTime: exam.start_time,
        endTime: exam.end_time,
        status: exam.status,
        createdBy: exam.created_by?.name || 'Unknown',
        createdById: exam.created_by?.id,
      }));
    }
  });
  
  const filteredExams = exams
    .filter(exam => 
      (statusFilter === 'all' || exam.status === statusFilter) &&
      (exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
       exam.class.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  
  const handleDeleteExam = async (id: string) => {
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Exam deleted successfully');
      
      // Refetch the exams list
      // This would be better with React Query's invalidateQueries
      window.location.reload();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy • HH:mm');
  };
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
            <p className="text-muted-foreground">
              Manage all exams across the portal
            </p>
          </div>
          <ButtonLink to="/admin/exams/create" className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Create New Exam
          </ButtonLink>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Exams</CardTitle>
                <CardDescription>
                  View and manage all exams in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="w-full py-10 flex justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-12 w-12 bg-primary/30 rounded-full mb-4"></div>
                      <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="py-6 text-center text-red-500">
                    Error loading exams. Please try again.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Title</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExams.length > 0 ? (
                          filteredExams.map(exam => (
                            <TableRow key={exam.id}>
                              <TableCell className="font-medium">{exam.title}</TableCell>
                              <TableCell>{exam.subject}</TableCell>
                              <TableCell>{exam.class}</TableCell>
                              <TableCell>
                                <div className="flex flex-col text-xs">
                                  <span>Start: {formatDate(exam.startTime)}</span>
                                  <span>End: {formatDate(exam.endTime)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                                  ${exam.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  exam.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                  exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                    onClick={() => handleDeleteExam(exam.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No exams found matching your criteria.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {['draft', 'scheduled', 'active', 'completed'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{status.charAt(0).toUpperCase() + status.slice(1)} Exams</CardTitle>
                  <CardDescription>
                    View and manage {status} exams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Title</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExams
                          .filter(exam => exam.status === status)
                          .length > 0 ? (
                          filteredExams
                            .filter(exam => exam.status === status)
                            .map(exam => (
                              <TableRow key={exam.id}>
                                <TableCell className="font-medium">{exam.title}</TableCell>
                                <TableCell>{exam.subject}</TableCell>
                                <TableCell>{exam.class}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col text-xs">
                                    <span>Start: {formatDate(exam.startTime)}</span>
                                    <span>End: {formatDate(exam.endTime)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="text-destructive hover:text-destructive/90"
                                      onClick={() => handleDeleteExam(exam.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No {status} exams found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ExamManagement;
