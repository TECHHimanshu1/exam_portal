import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Edit, Trash2, Search, UserPlus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  created_at: string;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  class: string;
  rollNumber: string;
  status: string;
  created_at: string;
}

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, type: 'teacher' | 'student', name: string } | null>(null);
  
  const { approveUser, rejectUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch teachers
      const { data: teacherProfiles, error: teacherError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('role', 'teacher');
      
      if (teacherError) {
        throw teacherError;
      }
      
      // Fetch teacher details with subjects
      const teachersWithSubjects = await Promise.all(
        teacherProfiles.map(async (profile) => {
          const { data: teacherDetails, error: detailsError } = await supabase
            .from('teacher_details')
            .select('subject_id')
            .eq('user_id', profile.id)
            .single();
          
          let subjectName = 'Not assigned';
          
          if (teacherDetails?.subject_id) {
            const { data: subject } = await supabase
              .from('subjects')
              .select('name')
              .eq('id', teacherDetails.subject_id)
              .single();
            
            if (subject) {
              subjectName = subject.name;
            }
          }
          
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            subject: subjectName,
            status: 'active', // Assuming all users in the db are active
            created_at: profile.created_at
          };
        })
      );
      
      setTeachers(teachersWithSubjects);
      
      // Fetch students
      const { data: studentProfiles, error: studentError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('role', 'student');
      
      if (studentError) {
        throw studentError;
      }
      
      // Improve student details fetching - directly join with classes table
      const { data: studentDetailsWithClass, error: joinError } = await supabase
        .from('student_details')
        .select(`
          user_id,
          roll_number,
          classes:class_id (
            id,
            name
          )
        `);
      
      if (joinError) {
        throw joinError;
      }
      
      // Create a map for easier lookup
      const studentDetailsMap = new Map();
      studentDetailsWithClass?.forEach(detail => {
        studentDetailsMap.set(detail.user_id, {
          className: detail.classes?.name || 'Not assigned',
          rollNumber: detail.roll_number || 'Not assigned'
        });
      });
      
      // Map student profiles with their details
      const studentsWithDetails = studentProfiles.map(profile => {
        const details = studentDetailsMap.get(profile.id) || {
          className: 'Not assigned',
          rollNumber: 'Not assigned'
        };
        
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          class: details.className,
          rollNumber: details.rollNumber,
          status: 'active', // Assuming all users in the db are active
          created_at: profile.created_at
        };
      });
      
      setStudents(studentsWithDetails);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(
    teacher => 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(
    student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (id: string, type: 'teacher' | 'student') => {
    const success = await approveUser(id);
    if (success) {
      // In a real app, update the state after successful approval
      if (type === 'teacher') {
        setTeachers(teachers.map(t => 
          t.id === id ? {...t, status: 'active'} : t
        ));
      } else {
        setStudents(students.map(s => 
          s.id === id ? {...s, status: 'active'} : s
        ));
      }
    }
  };

  const handleReject = async (id: string, type: 'teacher' | 'student') => {
    const success = await rejectUser(id);
    if (success) {
      // In a real app, remove the rejected user from state
      if (type === 'teacher') {
        setTeachers(teachers.filter(t => t.id !== id));
      } else {
        setStudents(students.filter(s => s.id !== id));
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const { id, type } = userToDelete;
    
    try {
      // First, delete user details from the respective table
      if (type === 'teacher') {
        const { error: teacherDetailsError } = await supabase
          .from('teacher_details')
          .delete()
          .eq('user_id', id);
          
        if (teacherDetailsError) throw teacherDetailsError;
      } else {
        const { error: studentDetailsError } = await supabase
          .from('student_details')
          .delete()
          .eq('user_id', id);
          
        if (studentDetailsError) throw studentDetailsError;
      }
      
      // Then delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
        
      if (profileError) throw profileError;
      
      // Finally, attempt to delete auth user
      // Note: This might require admin privileges in a real app
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.warn('Auth user could not be deleted, but profile was deleted:', authError);
      }
      
      toast.success(`${type === 'teacher' ? 'Teacher' : 'Student'} deleted successfully`);
      
      // Update state
      if (type === 'teacher') {
        setTeachers(teachers.filter(t => t.id !== id));
      } else {
        setStudents(students.filter(s => s.id !== id));
      }
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`);
    }
  };
  
  const openEditDialog = (userId: string, userType: 'teacher' | 'student') => {
    setSelectedUserId(userId);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (user: { id: string, type: 'teacher' | 'student', name: string }) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleUserUpdated = () => {
    fetchUsers();
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage teachers and students in the exam portal
            </p>
          </div>
          <ButtonLink to="/admin/users/add" className="shadow-button">
            <UserPlus className="h-4 w-4 mr-2" />
            Add {activeTab === 'teachers' ? 'Teacher' : 'Student'}
          </ButtonLink>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="teachers" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="teachers" className="relative">
              Teachers
              {teachers.filter(t => t.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {teachers.filter(t => t.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="relative">
              Students
              {students.filter(s => s.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {students.filter(s => s.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teachers" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>Manage teacher accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-12 w-12 bg-primary/30 rounded-full mb-4"></div>
                      <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-auto">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="pb-3 pl-1">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Subject</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map(teacher => (
                            <tr key={teacher.id} className="border-b last:border-0">
                              <td className="py-3 pl-1 font-medium">{teacher.name}</td>
                              <td className="py-3">{teacher.email}</td>
                              <td className="py-3">{teacher.subject}</td>
                              <td className="py-3">
                                {teacher.status === 'active' ? (
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">Active</span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                                )}
                              </td>
                              <td className="py-3 text-right pr-1">
                                {teacher.status === 'active' ? (
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => openEditDialog(teacher.id, 'teacher')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive"
                                      onClick={() => openDeleteDialog({
                                        id: teacher.id,
                                        type: 'teacher',
                                        name: teacher.name
                                      })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-green-600"
                                      onClick={() => handleApprove(teacher.id, 'teacher')}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive"
                                      onClick={() => handleReject(teacher.id, 'teacher')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-muted-foreground">
                              {searchQuery ? 'No teachers found matching search criteria' : 'No teachers found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>Manage student accounts and class assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-12 w-12 bg-primary/30 rounded-full mb-4"></div>
                      <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-auto">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="pb-3 pl-1">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Class</th>
                          <th className="pb-3">Roll Number</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(student => (
                            <tr key={student.id} className="border-b last:border-0">
                              <td className="py-3 pl-1 font-medium">{student.name}</td>
                              <td className="py-3">{student.email}</td>
                              <td className="py-3">{student.class}</td>
                              <td className="py-3">{student.rollNumber}</td>
                              <td className="py-3">
                                {student.status === 'active' ? (
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">Active</span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                                )}
                              </td>
                              <td className="py-3 text-right pr-1">
                                {student.status === 'active' ? (
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => openEditDialog(student.id, 'student')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive"
                                      onClick={() => openDeleteDialog({
                                        id: student.id,
                                        type: 'student',
                                        name: student.name
                                      })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-green-600"
                                      onClick={() => handleApprove(student.id, 'student')}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive"
                                      onClick={() => handleReject(student.id, 'student')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-muted-foreground">
                              {searchQuery ? 'No students found matching search criteria' : 'No students found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit User Dialog */}
      {selectedUserId && (
        <EditUserDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          userId={selectedUserId}
          userType={activeTab === 'teachers' ? 'teacher' : 'student'}
          onUserUpdated={handleUserUpdated}
        />
      )}
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {userToDelete?.name}'s account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default UserManagement;
