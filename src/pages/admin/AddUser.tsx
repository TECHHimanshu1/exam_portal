
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

const AddUser: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Using our custom hooks for data fetching
  const { 
    data: subjects, 
    isLoading: isLoadingSubjects 
  } = useSupabaseQuery<Subject>({
    tableName: 'subjects',
    columns: 'id, name',
    orderBy: { column: 'name' }
  });

  const { 
    data: classes, 
    isLoading: isLoadingClasses 
  } = useSupabaseQuery<Class>({
    tableName: 'classes',
    columns: 'id, name',
    orderBy: { column: 'name' }
  });

  // Set default selections when data is loaded
  React.useEffect(() => {
    if (subjects && subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
    
    if (classes && classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [subjects, classes, subjectId, classId]);

  const { insert: insertStudentDetails, isLoading: isInsertingStudent } = useSupabaseMutation('student_details');
  const { insert: insertTeacherDetails, isLoading: isInsertingTeacher } = useSupabaseMutation('teacher_details');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isLoadingSubjects || isLoadingClasses || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (role === 'teacher' && !subjectId) {
      toast.error('Please select a subject for the teacher');
      return;
    }
    
    if (role === 'student' && (!classId || !rollNumber)) {
      toast.error('Please fill in class and roll number for the student');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if roll number already exists for this class
      if (role === 'student') {
        const { data: existingStudent, error: checkError } = await supabase
          .from('student_details')
          .select('user_id')
          .eq('class_id', classId)
          .eq('roll_number', rollNumber);
          
        if (checkError) throw checkError;
        
        if (existingStudent && existingStudent.length > 0) {
          throw new Error(`Roll number ${rollNumber} is already used by another student in this class`);
        }
      }
      
      // Create the user account using regular signup instead of admin API
      const success = await register(name, email, password, role);
      
      if (!success) {
        setIsSubmitting(false);
        return;
      }
      
      // Get the newly created user to add details
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileError || !userProfiles) {
        throw new Error('Failed to retrieve user data');
      }
      
      const userId = userProfiles.id;
      
      // Add role-specific details
      if (role === 'teacher') {
        const result = await insertTeacherDetails({
          user_id: userId,
          subject_id: subjectId
        });
        
        if (!result) throw new Error('Failed to create teacher details');
      } else if (role === 'student') {
        const result = await insertStudentDetails({
          user_id: userId,
          class_id: classId,
          roll_number: rollNumber
        });
        
        if (!result) throw new Error('Failed to create student details');
      }
      
      toast.success(`${role === 'teacher' ? 'Teacher' : 'Student'} account created successfully`);
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Provide more user-friendly error messages
      const errorMessage = error.message?.includes('student_details_class_id_roll_number_key') 
        ? 'This roll number is already used by another student in the same class' 
        : error.message || 'Failed to create user account';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground">
            Create a new teacher or student account
          </p>
        </div>

        <Alert>
          <AlertDescription>
            When creating a new user, they will receive a confirmation email. The account will be automatically approved.
          </AlertDescription>
        </Alert>

        <Card className="glass-card">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Enter the details for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Type</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as 'teacher' | 'student')}
                  className="flex space-x-4"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <Label htmlFor="teacher" className="cursor-pointer">Teacher</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="cursor-pointer">Student</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {role === 'teacher' ? (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={subjectId}
                    onValueChange={setSubjectId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSubjects ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={classId}
                      onValueChange={setClassId}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClasses ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      placeholder="Enter roll number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="shadow-button w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : `Create ${role === 'teacher' ? 'Teacher' : 'Student'} Account`}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddUser;
