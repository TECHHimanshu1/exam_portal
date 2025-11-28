
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, Award, ArrowRight, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ButtonLink } from '@/components/ui/button-link';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [studentClass, setStudentClass] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      // First get student's class - FIXED: Use select() instead of single() since multiple records may exist
      const { data: studentDetailsList, error: studentError } = await supabase
        .from('student_details')
        .select('class_id, classes:class_id(name)')
        .eq('user_id', user?.id);

      if (studentError) throw studentError;
      
      // Use the first student detail if multiple exist
      if (studentDetailsList && studentDetailsList.length > 0) {
        const studentDetails = studentDetailsList[0];
        if (studentDetails?.classes?.name) {
          setStudentClass(studentDetails.classes.name);
        }
        
        // Fetch upcoming exams for student's class
        const today = new Date();
        const { data: exams, error: examsError } = await supabase
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
            subject:subjects(name)
          `)
          .eq('class_id', studentDetails?.class_id)
          .eq('status', 'scheduled')
          .gte('start_time', today.toISOString())
          .order('start_time', { ascending: true })
          .limit(3);

        if (examsError) throw examsError;

        // Format exam data
        const formattedExams = exams?.map(exam => {
          const examDate = new Date(exam.start_time);
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          let displayDate;
          if (examDate.toDateString() === today.toDateString()) {
            displayDate = 'Today';
          } else if (examDate.toDateString() === tomorrow.toDateString()) {
            displayDate = 'Tomorrow';
          } else {
            displayDate = format(examDate, 'dd MMM yyyy');
          }

          return {
            id: exam.id,
            title: exam.title,
            subject: exam.subject?.name || 'Unknown Subject',
            date: displayDate,
            time: format(examDate, 'h:mm a'),
            duration: `${exam.duration} minutes`,
            status: exam.status
          };
        });

        setUpcomingExams(formattedExams || []);
      }

      // Fetch recent results
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          total_marks,
          status,
          created_at,
          exam:exams(
            id,
            title,
            subject:subjects(name)
          )
        `)
        .eq('student_id', user?.id)
        .eq('status', 'graded')
        .order('created_at', { ascending: false })
        .limit(2);

      if (resultsError) throw resultsError;

      // Format results data
      const formattedResults = results?.map(result => {
        const percentage = Math.round((result.score / result.total_marks) * 100);
        let grade = 'F';
        
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B+';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C+';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';
        
        return {
          id: result.id,
          title: result.exam?.title || 'Unknown Exam',
          score: result.score,
          total: result.total_marks,
          date: format(new Date(result.created_at), 'dd MMM yyyy'),
          grade: grade,
          percentage
        };
      });

      setRecentResults(formattedResults || []);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-12 w-3/4 mb-2" />
      <Skeleton className="h-8 w-1/2 mb-8" />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="student">
        {renderLoadingSkeleton()}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      {isLoading ? renderLoadingSkeleton() : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Here's an overview of your exams and results.
            </p>
          </div>

          {/* Next Exam Alert */}
          {upcomingExams.length > 0 && upcomingExams[0].date === 'Today' && (
            <Card className="bg-primary-foreground border-primary border-l-4">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">You have an exam today!</h3>
                    <p className="text-sm text-muted-foreground">
                      {upcomingExams[0].title} at {upcomingExams[0].time}
                    </p>
                  </div>
                </div>
                <ButtonLink to={`/student/exams/${upcomingExams[0].id}`} variant="default" size="sm">
                  View Details
                </ButtonLink>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Upcoming Exams Card */}
            <Card className="glass-card md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Exams</CardTitle>
                    <CardDescription>Scheduled exams for you</CardDescription>
                  </div>
                  <ButtonLink to="/student/exams" variant="ghost" size="sm" className="text-primary">
                    View all
                  </ButtonLink>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingExams.length > 0 ? (
                    upcomingExams.map(exam => (
                      <div key={exam.id} className="flex items-start space-x-4 p-3 rounded-lg transition-all hover:bg-secondary/50">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-full mt-0.5">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{exam.title}</h4>
                            {exam.date === 'Today' || exam.date === 'Tomorrow' ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                {exam.date}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{exam.date}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">{exam.subject} • {exam.duration}</p>
                            <p className="text-xs text-muted-foreground">{exam.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto opacity-20 mb-2" />
                      <p>No upcoming exams scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your recent exam results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentResults.length > 0 ? (
                  recentResults.map(result => (
                    <div key={result.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{result.title}</p>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{result.grade}</span>
                          <div className="ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            {result.percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {result.score} out of {result.total} points • {result.date}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto opacity-20 mb-2" />
                    <p>No results available yet</p>
                  </div>
                )}
                <ButtonLink to="/student/results" variant="outline" size="sm" className="w-full mt-2">
                  <Award className="h-4 w-4 mr-2" />
                  View All Results
                </ButtonLink>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Class Schedule',
                description: 'View your weekly class schedule',
                icon: <Calendar className="h-5 w-5 text-primary" />,
                path: '#' // Placeholder path
              },
              {
                title: 'Study Materials',
                description: 'Access your course materials and resources',
                icon: <FileText className="h-5 w-5 text-primary" />,
                path: '#' // Placeholder path
              },
              {
                title: 'Practice Tests',
                description: 'Take practice tests to prepare for exams',
                icon: <BookOpen className="h-5 w-5 text-primary" />,
                path: '#' // Placeholder path
              },
            ].map((item, index) => (
              <Card key={index} className="glass-card hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <div className="bg-primary/10 p-2 rounded-full w-fit mb-2">
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <ButtonLink to={item.path} variant="ghost" className="w-full justify-between text-primary">
                    <span>Coming Soon</span>
                    <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
