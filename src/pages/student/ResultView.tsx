import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileTextIcon, BarChartIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ResultView: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  
  // Mock exam results
  const examResults = [
    {
      id: '1',
      examTitle: 'Mid-Term Mathematics Exam',
      subject: 'Mathematics',
      date: '2024-04-15',
      score: 85,
      totalMarks: 100,
      grade: 'A',
      status: 'completed',
      feedback: 'Excellent work on algebraic equations. Need to improve on calculus problems.',
      questions: [
        { id: '1', question: 'Solve for x: 2x + 5 = 15', yourAnswer: 'x = 5', correctAnswer: 'x = 5', marks: 5, total: 5 },
        { id: '2', question: 'Differentiate y = x²', yourAnswer: 'y\' = 2x', correctAnswer: 'y\' = 2x', marks: 5, total: 5 },
        { id: '3', question: 'Integrate ∫2x dx', yourAnswer: 'x² + C', correctAnswer: 'x² + C', marks: 5, total: 5 },
      ]
    },
    {
      id: '2',
      examTitle: 'Physics Concepts Test',
      subject: 'Physics',
      date: '2024-04-20',
      score: 72,
      totalMarks: 100,
      grade: 'B',
      status: 'completed',
      feedback: 'Good understanding of Newton\'s laws. Review fluid mechanics concepts.',
      questions: [
        { id: '1', question: 'State Newton\'s first law of motion', yourAnswer: 'A body continues in its state of rest or of uniform motion in a straight line unless acted upon by a force.', correctAnswer: 'A body continues in its state of rest or of uniform motion in a straight line unless acted upon by a force.', marks: 5, total: 5 },
        { id: '2', question: 'What is Archimedes\' principle?', yourAnswer: 'When a body is partially or fully immersed in a fluid, it experiences an upward force equal to the weight of the fluid displaced.', correctAnswer: 'Any object, wholly or partially immersed in a fluid, is buoyed up by a force equal to the weight of the fluid displaced by the object.', marks: 3, total: 5 },
      ]
    },
    {
      id: '3',
      examTitle: 'English Literature Quiz',
      subject: 'English',
      date: '2024-04-10',
      score: 92,
      totalMarks: 100,
      grade: 'A+',
      status: 'completed',
      feedback: 'Outstanding analysis of Shakespeare\'s works. Excellent writing style.',
      questions: [
        { id: '1', question: 'Who wrote "Romeo and Juliet"?', yourAnswer: 'William Shakespeare', correctAnswer: 'William Shakespeare', marks: 2, total: 2 },
        { id: '2', question: 'Analyze the theme of love in "Pride and Prejudice"', yourAnswer: 'Love is portrayed as a transformative force that overcomes social prejudices. Elizabeth and Darcy\'s relationship evolves from mutual dislike to deep respect and love, showing how true love can transcend social barriers and preconceptions.', correctAnswer: '', marks: 8, total: 10, comment: 'Excellent analysis with good textual references' },
      ]
    },
  ];

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
          <p className="text-muted-foreground">
            View your exam results and feedback
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card col-span-2">
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>
                Your most recent exam scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.examTitle}</TableCell>
                      <TableCell>{result.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {result.date}
                        </div>
                      </TableCell>
                      <TableCell>{result.score}/{result.totalMarks}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            result.grade === 'A+' || result.grade === 'A' 
                              ? 'bg-green-500' 
                              : result.grade === 'B' 
                              ? 'bg-blue-500' 
                              : 'bg-amber-500'
                          }
                        >
                          {result.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedExam(result.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Your overall academic performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">83%</div>
                <div className="text-sm text-muted-foreground">Overall Average</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span className="text-sm">Mathematics</span>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                    <span className="text-sm">Physics</span>
                  </div>
                  <span className="text-sm font-medium">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                    <span className="text-sm">English</span>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" className="w-full">
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed exam result dialog */}
      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Exam Result Details</DialogTitle>
            <DialogDescription>
              {selectedExam && examResults.find(r => r.id === selectedExam)?.examTitle}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam && (
            <Tabs defaultValue="summary">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {examResults.find(r => r.id === selectedExam)?.score}/
                        {examResults.find(r => r.id === selectedExam)?.totalMarks}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge 
                        className={`text-lg px-3 py-1 ${
                          examResults.find(r => r.id === selectedExam)?.grade === 'A+' || 
                          examResults.find(r => r.id === selectedExam)?.grade === 'A' 
                            ? 'bg-green-500' 
                            : examResults.find(r => r.id === selectedExam)?.grade === 'B' 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                        }`}
                      >
                        {examResults.find(r => r.id === selectedExam)?.grade}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Teacher's Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{examResults.find(r => r.id === selectedExam)?.feedback}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="questions" className="space-y-4">
                {examResults.find(r => r.id === selectedExam)?.questions.map((q, index) => (
                  <Card key={q.id}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Question {index + 1}</CardTitle>
                      <CardDescription>{q.question}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm">Your Answer</h4>
                        <p className="mt-1 text-sm">{q.yourAnswer}</p>
                      </div>
                      {q.correctAnswer && (
                        <div>
                          <h4 className="font-medium text-sm">Correct Answer</h4>
                          <p className="mt-1 text-sm">{q.correctAnswer}</p>
                        </div>
                      )}
                      {q.comment && (
                        <div>
                          <h4 className="font-medium text-sm">Teacher's Comment</h4>
                          <p className="mt-1 text-sm">{q.comment}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <h4 className="font-medium text-sm">Marks</h4>
                        <Badge className={q.marks === q.total ? 'bg-green-500' : 'bg-amber-500'}>
                          {q.marks}/{q.total}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ResultView;

