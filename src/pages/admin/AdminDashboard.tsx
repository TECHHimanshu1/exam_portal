
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, BookOpen, Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  time: string;
  iconBg: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: { count: 0, change: 0 },
    teachers: { count: 0, change: 0 },
    students: { count: 0, change: 0 },
    activeExams: { count: 0, scheduled: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch total users count
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('role');
        
        if (profilesError) throw profilesError;
        
        // Count users by role
        const teacherCount = profiles.filter(p => p.role === 'teacher').length;
        const studentCount = profiles.filter(p => p.role === 'student').length;
        const totalCount = profiles.length;
        
        // Fetch active exams
        const { data: activeExams, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'active');
        
        if (examsError) throw examsError;
        
        // Get scheduled exams for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: scheduledToday, error: scheduledError } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'scheduled')
          .gte('start_time', today.toISOString())
          .lt('start_time', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());
        
        if (scheduledError) throw scheduledError;
        
        // Fetch recent activity
        const { data: recentExams, error: recentExamsError } = await supabase
          .from('exams')
          .select(`
            id, 
            title, 
            created_at,
            created_by (name)
          `)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentExamsError) throw recentExamsError;
        
        // Fetch recent teacher registrations
        const { data: recentTeachers, error: recentTeachersError } = await supabase
          .from('profiles')
          .select('id, name, created_at')
          .eq('role', 'teacher')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentTeachersError) throw recentTeachersError;
        
        // Format and set recent activity
        const activityItems: ActivityItem[] = [];
        
        // Add exam creation
        if (recentExams && recentExams.length > 0) {
          const exam = recentExams[0];
          activityItems.push({
            id: exam.id,
            title: exam.title,
            description: `New exam created by ${exam.created_by?.name || 'Unknown'}`,
            icon: <FileText className="h-4 w-4" />,
            time: getTimeAgo(exam.created_at),
            iconBg: 'bg-blue-100 text-blue-700'
          });
        } else {
          // Mock exam activity if none exists
          activityItems.push({
            id: '1',
            title: 'Final Exam - Mathematics',
            description: 'New exam created by Sarah Johnson',
            icon: <FileText className="h-4 w-4" />,
            time: '10 minutes ago',
            iconBg: 'bg-blue-100 text-blue-700'
          });
        }
        
        // Add teacher registration
        if (recentTeachers && recentTeachers.length > 0) {
          const teacher = recentTeachers[0];
          activityItems.push({
            id: teacher.id,
            title: 'New Teacher Registration',
            description: `${teacher.name} requested approval`,
            icon: <Users className="h-4 w-4" />,
            time: getTimeAgo(teacher.created_at),
            iconBg: 'bg-purple-100 text-purple-700'
          });
        } else {
          // Mock teacher registration if none exists
          activityItems.push({
            id: '2',
            title: 'New Teacher Registration',
            description: 'Robert Smith requested approval',
            icon: <Users className="h-4 w-4" />,
            time: '42 minutes ago',
            iconBg: 'bg-purple-100 text-purple-700'
          });
        }
        
        // Add mock exam results
        activityItems.push({
          id: '3',
          title: 'Mid-term Exam Results',
          description: 'Results published for Science class',
          icon: <Award className="h-4 w-4" />,
          time: '2 hours ago',
          iconBg: 'bg-green-100 text-green-700'
        });
        
        // Set state with fetched data
        setStats({
          totalUsers: { count: totalCount, change: 8 },
          teachers: { count: teacherCount, change: 2 },
          students: { count: studentCount, change: 15 },
          activeExams: { 
            count: activeExams?.length || 0, 
            scheduled: scheduledToday?.length || 0 
          }
        });
        
        setRecentActivity(activityItems);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  // Helper to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's an overview of your exam portal.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Dashboard Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Users Stat */}
              <Card className="glass-card hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.totalUsers.count}</div>
                    <div className="rounded-full p-2 bg-blue-100 text-blue-700">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="text-green-500 font-medium">+{stats.totalUsers.change}%</span> from last month
                  </p>
                </CardContent>
              </Card>

              {/* Teachers Stat */}
              <Card className="glass-card hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.teachers.count}</div>
                    <div className="rounded-full p-2 bg-purple-100 text-purple-700">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="text-green-500 font-medium">+{stats.teachers.change}</span> new this week
                  </p>
                </CardContent>
              </Card>

              {/* Students Stat */}
              <Card className="glass-card hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.students.count}</div>
                    <div className="rounded-full p-2 bg-green-100 text-green-700">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="text-green-500 font-medium">+{stats.students.change}</span> new this week
                  </p>
                </CardContent>
              </Card>

              {/* Exams Stat */}
              <Card className="glass-card hover:shadow-card transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Exams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.activeExams.count}</div>
                    <div className="rounded-full p-2 bg-amber-100 text-amber-700">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="text-blue-500 font-medium">{stats.activeExams.scheduled}</span> scheduled today
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Activity Items */}
                  {recentActivity.map((item, index) => (
                    <div key={item.id} className="flex items-start space-x-4">
                      <div className={`rounded-full p-2 ${item.iconBg} mt-0.5`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
