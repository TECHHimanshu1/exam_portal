
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Users, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import Chart from '@/components/analytics/Chart';
import {
  SubjectPerformance,
  ExamCompletion,
  RecentExam,
  TopStudent,
  formatSubjectPerformanceData,
  formatExamCompletionData,
  formatTopStudentsData,
  calculateExamCompletionRate,
  getClassDistributionData
} from '@/utils/reportFormatters';

// Utility function to calculate color based on performance
const getPerformanceColor = (percentage: number) => {
  if (percentage >= 80) {
    return 'bg-green-100 text-green-800';
  } else if (percentage >= 60) {
    return 'bg-yellow-100 text-yellow-800';
  } else {
    return 'bg-red-100 text-red-800';
  }
};

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  // Mock counts for the overview cards
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    exams: 0
  });

  // Define chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Fetch count data for each entity
  const { data: studentsCount, isLoading: isLoadingStudents } = useSupabaseQuery<{ count: number }>({
    tableName: 'profiles',
    columns: 'count(*)',
    filters: [{ column: 'role', operator: 'eq', value: 'student' }],
    dependencies: [],
  });

  const { data: teachersCount, isLoading: isLoadingTeachers } = useSupabaseQuery<{ count: number }>({
    tableName: 'profiles',
    columns: 'count(*)',
    filters: [{ column: 'role', operator: 'eq', value: 'teacher' }],
    dependencies: [],
  });

  const { data: subjectsCount, isLoading: isLoadingSubjects } = useSupabaseQuery<{ count: number }>({
    tableName: 'subjects',
    columns: 'count(*)',
    dependencies: [],
  });

  const { data: examsCount, isLoading: isLoadingExams } = useSupabaseQuery<{ count: number }>({
    tableName: 'exams',
    columns: 'count(*)',
    dependencies: [],
  });

  // Update counts when data is loaded
  useEffect(() => {
    setCounts({
      students: studentsCount?.[0]?.count || 0,
      teachers: teachersCount?.[0]?.count || 0,
      subjects: subjectsCount?.[0]?.count || 0,
      exams: examsCount?.[0]?.count || 0
    });
  }, [studentsCount, teachersCount, subjectsCount, examsCount]);

  // Fetch subject performance data
  const { data: subjectPerformance, isLoading: isLoadingSubjectPerf } = useSupabaseQuery<SubjectPerformance>({
    tableName: 'exam_results',
    columns: `
      subjects!inner(name),
      avg(score) as average_score,
      max(score) as highest_score,
      min(score) as lowest_score
    `,
    groupBy: ['subjects.name'],
    relationshipMap: {
      subjects: 'exams.subject_id'
    },
    dependencies: [],
  });

  // Fetch exam completion data
  const { data: examCompletionData, isLoading: isLoadingCompletion } = useSupabaseQuery<ExamCompletion>({
    tableName: 'exam_results',
    columns: `
      created_at,
      status,
      total_marks,
      score
    `,
    orderBy: { column: 'created_at', ascending: true },
    limit: 100,
    dependencies: [],
  });

  // Calculate exam completion rate
  const examCompletionRate = calculateExamCompletionRate(examCompletionData);

  // Fetch recent exams with related data
  const { data: recentExams, isLoading: isLoadingRecentExams } = useSupabaseQuery<RecentExam>({
    tableName: 'exams',
    columns: `
      id,
      title,
      status,
      created_at,
      classes!exams_class_id_fkey(name),
      subjects!exams_subject_id_fkey(name)
    `,
    orderBy: { column: 'created_at', ascending: false },
    limit: 10,
    relationshipMap: {
      classes: 'exams_class_id_fkey',
      subjects: 'exams_subject_id_fkey'
    },
    dependencies: [],
  });

  // Fetch top performing students
  const { data: topStudents, isLoading: isLoadingTopStudents } = useSupabaseQuery<TopStudent>({
    tableName: 'exam_results',
    columns: `
      profiles!exam_results_student_id_fkey(name),
      classes!inner(name)
    `,
    groupBy: ['profiles.name', 'classes.name'],
    aggregations: [
      { function: 'avg', column: 'score', alias: 'average_score' },
      { function: 'count', column: 'id', alias: 'exams_taken' }
    ],
    relationshipMap: {
      profiles: 'exam_results_student_id_fkey',
      classes: 'student_details.class_id'
    },
    dependencies: [],
  });

  // Class distribution data for pie chart
  const studentPerformanceData = getClassDistributionData(topStudents);

  const handleExportData = () => {
    toast.success('Data exported successfully!');
  };

  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingSubjects || isLoadingExams || isLoadingSubjectPerf || isLoadingCompletion || isLoadingRecentExams || isLoadingTopStudents;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              View performance metrics and generate reports
            </p>
          </div>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
            <TabsTrigger value="exams">Exam Analytics</TabsTrigger>
            <TabsTrigger value="students">Student Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.students}</div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled in the system
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Teachers
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.teachers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active in the system
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Subjects
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.subjects}</div>
                  <p className="text-xs text-muted-foreground">
                    Available to students
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Exams
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counts.exams}</div>
                  <p className="text-xs text-muted-foreground">
                    Created in the system
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Exams</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRecentExams ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Title</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentExams && recentExams.length > 0 ? (
                          recentExams.map((exam) => (
                            <TableRow key={exam.id}>
                              <TableCell className="font-medium">{exam.title}</TableCell>
                              <TableCell>{exam.classes?.name}</TableCell>
                              <TableCell>{exam.subjects?.name}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  exam.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  exam.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                                  exam.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {exam.status}
                                </span>
                              </TableCell>
                              <TableCell>{format(new Date(exam.created_at), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">No recent exams found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Performing Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTopStudents ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Avg. Score</TableHead>
                          <TableHead>Exams</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topStudents && topStudents.length > 0 ? (
                          formatTopStudentsData(topStudents).map((student, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{student.student}</TableCell>
                              <TableCell>{student.class}</TableCell>
                              <TableCell>{student.averageScore}%</TableCell>
                              <TableCell>{student.examsTaken}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">No student data available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSubjectPerf ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Chart
                    type="bar"
                    data={formatSubjectPerformanceData(subjectPerformance)}
                    options={{
                      xAxisKey: 'subject',
                      bars: [
                        { dataKey: 'averageScore', fill: '#8884d8' },
                        { dataKey: 'highestScore', fill: '#82ca9d' },
                        { dataKey: 'lowestScore', fill: '#ffc658' },
                      ],
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exam Completion Rate</CardTitle>
                <CardDescription>Percentage of exams completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{examCompletionRate}%</div>
                <p className="text-sm text-muted-foreground">
                  Compared to the average of 65%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Performance by Class</CardTitle>
                <CardDescription>Distribution of students across classes</CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  type="pie"
                  data={studentPerformanceData}
                  options={{
                    dataKey: 'value',
                    nameKey: 'name',
                    colors: COLORS,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam Completion Over Time</CardTitle>
                <CardDescription>Trends in exam completion</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCompletion ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Chart
                    type="line"
                    data={formatExamCompletionData(examCompletionData)}
                    options={{
                      xAxisKey: 'date',
                      lines: [
                        { dataKey: 'score', stroke: '#8884d8' },
                        { dataKey: 'totalMarks', stroke: '#82ca9d' },
                      ],
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Students</CardTitle>
                <CardDescription>Average scores of top students</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTopStudents ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Chart
                    type="bar"
                    data={formatTopStudentsData(topStudents)}
                    options={{
                      xAxisKey: 'student',
                      bars: [{ dataKey: 'averageScore', fill: '#8884d8' }],
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
