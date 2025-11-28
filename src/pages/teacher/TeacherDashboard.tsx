
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, Calendar, CheckCircle, FileText, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface DashboardStat {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface UpcomingExam {
  id: string;
  title: string;
  class: string;
  date: string;
  displayDate: string;
  time: string;
  students: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface PerformanceItem {
  id: string;
  title: string;
  percentage: number;
  increase: number;
  detail: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch teacher details
        const { data: teacherDetails, error: teacherError } = await supabase
          .from('teacher_details')
          .select('subject_id')
          .eq('user_id', user.id)
          .single();
        
        if (teacherError) throw teacherError;
        
        // Get classes taught by this teacher (for demo, we'll use a simple query)
        const { data: classesTaught, error: classesError } = await supabase
          .from('exams')
          .select('class_id')
          .eq('created_by', user.id)
          .eq('subject_id', teacherDetails.subject_id);
        
        if (classesError) throw classesError;
        
        // Get unique class IDs
        const uniqueClassIds = [...new Set(classesTaught?.map(c => c.class_id) || [])];
        
        // Count students in those classes
        let totalStudents = 0;
        if (uniqueClassIds.length > 0) {
          const { count, error: studentsError } = await supabase
            .from('student_details')
            .select('*', { count: 'exact', head: true })
            .in('class_id', uniqueClassIds);
          
          if (studentsError) throw studentsError;
          totalStudents = count || 0;
        }
        
        // Count questions created by this teacher
        const { count: questionCount, error: questionError } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        
        if (questionError) throw questionError;
        
        // Count upcoming exams (scheduled or active)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: upcomingExamsCount, error: upcomingError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .in('status', ['scheduled', 'active'])
          .gte('start_time', today.toISOString());
        
        if (upcomingError) throw upcomingError;
        
        // Count completed exams this semester (assume last 6 months is a semester)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { count: completedExamsCount, error: completedError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .eq('status', 'completed')
          .gte('start_time', sixMonthsAgo.toISOString());
        
        if (completedError) throw completedError;
        
        // Set statistics
        setStats([
          {
            title: 'Total Students',
            value: totalStudents,
            subtitle: `Across ${uniqueClassIds.length} classes`,
            icon: <Users className="h-4 w-4" />,
            iconBg: 'bg-blue-100 text-blue-700'
          },
          {
            title: 'Question Bank',
            value: questionCount || 0,
            subtitle: 'Questions created',
            icon: <BookOpen className="h-4 w-4" />,
            iconBg: 'bg-purple-100 text-purple-700'
          },
          {
            title: 'Upcoming Exams',
            value: upcomingExamsCount || 0,
            subtitle: 'Next: Today, 10:00 AM',
            icon: <Calendar className="h-4 w-4" />,
            iconBg: 'bg-amber-100 text-amber-700'
          },
          {
            title: 'Completed Exams',
            value: completedExamsCount || 0,
            subtitle: 'This semester',
            icon: <CheckCircle className="h-4 w-4" />,
            iconBg: 'bg-green-100 text-green-700'
          }
        ]);
        
        // Fetch upcoming exams with details
        const { data: upcomingExamsData, error: examsDetailError } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            class_id,
            start_time,
            status
          `)
          .eq('created_by', user.id)
          .in('status', ['scheduled', 'active'])
          .gte('start_time', today.toISOString())
          .order('start_time', { ascending: true })
          .limit(3);
        
        if (examsDetailError) throw examsDetailError;
        
        // Format upcoming exams with class names
        const formattedExams: UpcomingExam[] = [];
        
        for (const exam of (upcomingExamsData || [])) {
          // Get class name
          const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', exam.class_id)
            .single();
          
          // Count students in this class
          const { count: studentCount } = await supabase
            .from('student_details')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', exam.class_id);
          
          const examDate = new Date(exam.start_time);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = addDays(today, 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          let displayDate = format(examDate, 'dd MMM yyyy');
          
          // Check if it's today or tomorrow
          if (examDate >= today && examDate < tomorrow) {
            displayDate = 'Today';
          } else if (examDate >= tomorrow && examDate < addDays(tomorrow, 1)) {
            displayDate = 'Tomorrow';
          }
          
          formattedExams.push({
            id: exam.id,
            title: exam.title,
            class: classData?.name || 'Unknown Class',
            date: format(examDate, 'yyyy-MM-dd'),
            displayDate,
            time: format(examDate, 'h:mm a'),
            students: studentCount || 0
          });
        }
        
        setUpcomingExams(formattedExams);
        
        // For demo purposes, let's set some mock recent activity
        // In a real app, we'd fetch this from the database
        setRecentActivity([
          {
            id: '1',
            title: 'Physics Final Exam',
            description: 'You created a new exam',
            time: '2 hours ago',
            icon: <FileText className="h-4 w-4" />,
            iconBg: 'bg-blue-100 text-blue-700'
          },
          {
            id: '2',
            title: 'Mathematics Quiz Results',
            description: 'You graded 28 submissions',
            time: 'Yesterday',
            icon: <Award className="h-4 w-4" />,
            iconBg: 'bg-green-100 text-green-700'
          }
        ]);
        
        // For demo purposes, set mock performance data
        // In a real app, we'd calculate this from actual exam results
        setPerformance([
          {
            id: '1',
            title: 'Mathematics Quiz',
            percentage: 78,
            increase: 5,
            detail: '26 of 32 students passed'
          },
          {
            id: '2',
            title: 'Physics Lab Test',
            percentage: 82,
            increase: 8,
            detail: '28 of 34 students passed'
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's an overview of your teaching activities.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card hover:shadow-card transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{isLoading ? '...' : stat.value}</div>
                  <div className={`rounded-full p-2 ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Exams */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <p className="text-sm text-muted-foreground">Scheduled exams for your classes</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading exams...
                    </TableCell>
                  </TableRow>
                ) : upcomingExams.length > 0 ? (
                  upcomingExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>
                        <Badge variant={exam.displayDate === 'Today' ? 'default' : 
                               exam.displayDate === 'Tomorrow' ? 'secondary' : 'outline'}>
                          {exam.displayDate}
                        </Badge>
                      </TableCell>
                      <TableCell>{exam.time}</TableCell>
                      <TableCell>{exam.students}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No upcoming exams scheduled
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Your latest actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-muted rounded-md"></div>
                    <div className="h-12 bg-muted rounded-md"></div>
                  </div>
                ) : recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className={`rounded-full p-2 ${activity.iconBg} mt-0.5`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Recent exam statistics</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-muted rounded-md"></div>
                    <div className="h-12 bg-muted rounded-md"></div>
                  </div>
                ) : performance.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.title}</p>
                      <div className="flex items-center">
                        <span className="text-sm font-bold">{item.percentage}%</span>
                        <span className="text-xs text-green-500 ml-1">+{item.increase}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
