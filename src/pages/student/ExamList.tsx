import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, ArrowRight, BookOpen, CheckCircle, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useStudentData } from '@/hooks/useStudentData';

const ExamList = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [completedExams, setCompletedExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedExams, setAttemptedExams] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { classIds, isLoading: loadingStudentData, error: studentDataError, checkAttemptedExams } = useStudentData();
  
  useEffect(() => {
    if (user && classIds.length > 0 && !loadingStudentData) {
      fetchExams();
    } else if (!loadingStudentData && classIds.length === 0 && user) {
      toast.error('No classes assigned to you. Please contact an administrator.');
      setIsLoading(false);
    }
  }, [user, classIds, loadingStudentData]);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching exams for class IDs:', classIds);
      
      const today = new Date().toISOString();
      
      // Fetch active exams for student's classes
      const { data: active, error: activeError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration,
          total_marks,
          start_time,
          end_time,
          status,
          subject:subjects(name),
          class:classes(name)
        `)
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (activeError) {
        console.error('Error fetching active exams:', activeError);
        throw activeError;
      }
      
      console.log('Active exams fetched:', active);
      setActiveExams(active || []);
      
      // Check which exams have already been attempted
      if (active && active.length > 0) {
        const examIds = active.map(exam => exam.id);
        const attempted = await checkAttemptedExams(examIds);
        setAttemptedExams(attempted);
      }
      
      // Fetch upcoming/scheduled exams for student's classes
      const { data: upcoming, error: upcomingError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration,
          total_marks,
          start_time,
          end_time,
          status,
          subject:subjects(name),
          class:classes(name)
        `)
        .in('class_id', classIds)
        .eq('status', 'scheduled')
        .gte('start_time', today)
        .order('start_time', { ascending: true });

      if (upcomingError) {
        console.error('Error fetching upcoming exams:', upcomingError);
        throw upcomingError;
      }
      
      console.log('Upcoming exams fetched:', upcoming);
      setUpcomingExams(upcoming || []);
      
      // Fetch completed exams (fetch results as they indicate completion)
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          status,
          exam:exams(
            id,
            title,
            duration,
            total_marks,
            start_time,
            subject:subjects(name),
            class:classes(name)
          )
        `)
        .eq('student_id', user?.id);

      if (resultsError) {
        console.error('Error fetching exam results:', resultsError);
        throw resultsError;
      }
      
      console.log('Exam results fetched:', results);
      
      // Format and filter out invalid results
      const validResults = results?.filter(r => r.exam) || [];
      setCompletedExams(validResults);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      toast.error(`Failed to load exams: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Show loading while we're fetching student data
  if (loadingStudentData) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your details...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if there was a problem loading student data
  if (studentDataError) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="p-6 text-center space-y-2">
          <div className="text-red-500 font-medium">Error loading your student details</div>
          <p>{studentDataError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
          <p className="text-muted-foreground">
            View your active, upcoming and completed exams
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="relative">
              Active Exams
              {activeExams.length > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                  {activeExams.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="relative">
              Upcoming Exams
              {upcomingExams.length > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {upcomingExams.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Exams
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Active Exams</CardTitle>
                <CardDescription>Exams that are currently available for you to take</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activeExams.length > 0 ? (
                  <div className="space-y-4">
                    {activeExams.map(exam => {
                      const isAttempted = attemptedExams[exam.id] || false;
                      
                      return (
                        <div key={exam.id} className={`p-4 border rounded-md hover:bg-secondary/50 transition-colors ${
                          isAttempted ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-lg">{exam.title}</h3>
                                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                  isAttempted ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'
                                }`}>
                                  {isAttempted ? 'Completed' : 'Active'}
                                </span>
                              </div>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  <span>{exam.subject?.name || 'Unknown Subject'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>{formatDate(exam.start_time)}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>
                                    {format(new Date(exam.start_time), 'h:mm a')} • {exam.duration} minutes
                                  </span>
                                </div>
                                <div className="flex items-center font-medium text-primary">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span>Total marks: {exam.total_marks}</span>
                                </div>
                              </div>
                            </div>
                            {isAttempted ? (
                              <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-2">Exam already completed</span>
                                <Button variant="outline" className="mt-2" disabled>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Completed
                                </Button>
                              </div>
                            ) : (
                              <Link to={`/student/exams/${exam.id}`}>
                                <Button variant="default" className="mt-2 bg-green-500 hover:bg-green-600">
                                  <span className="mr-2">Take Exam Now</span>
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No active exams</h3>
                    <p className="text-muted-foreground mt-1">
                      You don't have any exams that are currently active
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Upcoming Exams</CardTitle>
                <CardDescription>Scheduled exams that will be available soon</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : upcomingExams.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingExams.map(exam => (
                      <div key={exam.id} className="p-4 border rounded-md hover:bg-secondary/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium text-lg">{exam.title}</h3>
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                                Scheduled
                              </span>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                <span>{exam.subject?.name || 'Unknown Subject'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{formatDate(exam.start_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>
                                  {format(new Date(exam.start_time), 'h:mm a')} • {exam.duration} minutes
                                </span>
                              </div>
                              <div className="flex items-center font-medium text-primary">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>Total marks: {exam.total_marks}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="mt-2" disabled>
                            <span className="mr-2">Not Available Yet</span>
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No upcoming exams</h3>
                    <p className="text-muted-foreground mt-1">
                      You don't have any upcoming exams scheduled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Completed Exams</CardTitle>
                <CardDescription>Exams that you have already taken</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : completedExams.length > 0 ? (
                  <div className="space-y-4">
                    {completedExams.map(result => (
                      <div key={result.id} className="p-4 border rounded-md hover:bg-secondary/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{result.exam?.title}</h3>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                <span>{result.exam?.subject?.name || 'Unknown Subject'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{formatDate(result.exam?.start_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{result.exam?.duration} minutes</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                <span className="font-medium text-green-500">
                                  {result.status === 'graded' ? (
                                    <>
                                      Score: {result.score}/{result.exam?.total_marks} 
                                      ({Math.round((result.score / result.exam?.total_marks) * 100)}%)
                                    </>
                                  ) : (
                                    'Pending grading'
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link to={`/student/results/${result.id}`}>
                            <Button variant="outline" className="mt-2">
                              <span className="mr-2">View Results</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No completed exams</h3>
                    <p className="text-muted-foreground mt-1">
                      You haven't completed any exams yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ExamList;
