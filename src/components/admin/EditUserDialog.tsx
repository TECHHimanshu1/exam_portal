
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'teacher' | 'student';
  onUserUpdated: () => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userType,
  onUserUpdated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedValue, setAssignedValue] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
      
      if (userType === 'teacher') {
        fetchSubjects();
      } else {
        fetchClasses();
      }
    }
  }, [isOpen, userId, userType]);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setName(profile.name);
      setEmail(profile.email);
      
      // Get teacher or student details
      if (userType === 'teacher') {
        const { data: teacherDetails, error: teacherError } = await supabase
          .from('teacher_details')
          .select('subject_id')
          .eq('user_id', userId)
          .single();
        
        if (!teacherError && teacherDetails) {
          setAssignedValue(teacherDetails.subject_id);
        }
      } else {
        const { data: studentDetails, error: studentError } = await supabase
          .from('student_details')
          .select('class_id, roll_number')
          .eq('user_id', userId)
          .single();
        
        if (!studentError && studentDetails) {
          setAssignedValue(studentDetails.class_id);
          setRollNumber(studentDetails.roll_number || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };
  
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };
  
  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    
    if (userType === 'student' && !rollNumber.trim()) {
      toast.error('Roll number is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Check if roll number is already used by another student in the same class
      if (userType === 'student') {
        const { data: existingStudent, error } = await supabase
          .from('student_details')
          .select('user_id')
          .eq('class_id', assignedValue)
          .eq('roll_number', rollNumber)
          .neq('user_id', userId);
        
        if (error) throw error;
        
        if (existingStudent && existingStudent.length > 0) {
          throw new Error(`Roll number ${rollNumber} is already used by another student in this class`);
        }
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Update teacher or student details
      if (userType === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teacher_details')
          .update({
            subject_id: assignedValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (teacherError) throw teacherError;
      } else {
        const { error: studentError } = await supabase
          .from('student_details')
          .update({
            class_id: assignedValue,
            roll_number: rollNumber,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (studentError) throw studentError;
      }
      
      toast.success('User updated successfully');
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // More user-friendly error message
      const errorMessage = error.message?.includes('student_details_class_id_roll_number_key') 
        ? 'This roll number is already used by another student in the same class'
        : error.message || 'Failed to update user';
        
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {userType === 'teacher' ? 'Teacher' : 'Student'}</DialogTitle>
          <DialogDescription>
            Update {userType === 'teacher' ? 'teacher' : 'student'} information
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            
            {userType === 'teacher' ? (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={assignedValue} onValueChange={setAssignedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={assignedValue} onValueChange={setAssignedValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Roll number"
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
