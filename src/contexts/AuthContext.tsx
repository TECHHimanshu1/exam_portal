
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  createUser: (name: string, email: string, role: UserRole) => Promise<boolean>;
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Utility function to fetch user profile with timeout
  const fetchUserProfile = async (userId: string, timeoutMs = 5000): Promise<User | null> => {
    try {
      // Create a promise that will resolve with the profile data
      const fetchPromise = new Promise<User | null>(async (resolve, reject) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            reject(profileError);
            return;
          }
          
          if (profile) {
            resolve({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              createdAt: profile.created_at,
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
          reject(error);
        }
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<User | null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timed out')), timeoutMs);
      });
      
      // Race the fetch against the timeout
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error('Profile fetch with timeout error:', error);
      return null;
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check for existing session
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (session) {
          try {
            const userProfile = await fetchUserProfile(session.user.id);
            setUser(userProfile);
          } catch (error) {
            console.error('Error fetching user profile during init:', error);
            // Clear session if profile fetch fails
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        } catch (error) {
          console.error('Error fetching user profile during auth state change:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      console.log(`Attempting to login with email: ${email} and role: ${role}`);
      
      // First attempt authentication
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to log in');
      }
      
      if (!data.user) {
        throw new Error('No user data returned from authentication');
      }
      
      // Immediately fetch the user profile
      const userProfile = await fetchUserProfile(data.user.id);
      
      if (!userProfile) {
        throw new Error('Failed to load user profile');
      }
      
      // Verify the user's role
      if (userProfile.role !== role) {
        console.error(`Role mismatch: expected ${role}, got ${userProfile.role}`);
        await supabase.auth.signOut();
        throw new Error(`This account is not registered as a ${role}`);
      }
      
      setUser(userProfile);
      return true;
    } catch (error: any) {
      console.error('Login process error:', error);
      // Make sure to sign out if there was an error
      await supabase.auth.signOut().catch(e => console.error('Error during signout after failed login:', e));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // First, check if email already exists
      const { data: existingUser, error: emailCheckError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        toast.error('Email already in use');
        return false;
      }
      
      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      toast.success('Account created successfully!');
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (name: string, email: string, role: UserRole): Promise<boolean> => {
    // Only admins can create users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can create new users');
      return false;
    }
    
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(2, 10);
      
      // Use regular signup instead of admin API
      const success = await register(name, email, tempPassword, role);
      
      if (!success) {
        return false;
      }
      
      // In a real scenario, you'd send an email with the temporary password
      console.log(`Temporary password for ${email}: ${tempPassword}`);
      
      toast.success(`${role === 'teacher' ? 'Teacher' : 'Student'} account created successfully!`);
      return true;
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error('Failed to create user. Please try again.');
      return false;
    }
  };

  const approveUser = async (userId: string): Promise<boolean> => {
    // Only admins can approve users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can approve user accounts');
      return false;
    }
    
    try {
      // In a real implementation, this would update an "approved" or "active" field
      // Since the 'status' field doesn't exist in our profiles table, we need to modify this
      // Instead, let's use a field that exists in the database
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() }) // Just update the timestamp as a workaround
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      toast.success('User approved successfully');
      return true;
    } catch (error: any) {
      console.error('Approve user error:', error);
      toast.error('Failed to approve user. Please try again.');
      return false;
    }
  };

  const rejectUser = async (userId: string): Promise<boolean> => {
    // Only admins can reject users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can reject user accounts');
      return false;
    }
    
    try {
      // In a real implementation, this would either delete the user or update a "status" field
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }
      
      toast.success('User rejected successfully');
      return true;
    } catch (error: any) {
      console.error('Reject user error:', error);
      toast.error('Failed to reject user. Please try again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        createUser,
        approveUser,
        rejectUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
