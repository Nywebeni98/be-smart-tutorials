// Authentication context to manage user session state across the app
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { TutorProfile } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

// User roles
export type UserRole = 'student' | 'tutor' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  tutorProfile: TutorProfile | null;
  userRole: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  tutorSignInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  tutorSignUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  tutorSignIn: (email: string, password: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  adminSignIn: (username: string, password: string) => Promise<{ error?: string }>;
  adminSignOut: () => Promise<void>;
  getAdminToken: () => string | null;
  isAdmin: boolean;
  refreshTutorProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if email is allowed for tutor access (via server API)
  const checkTutorEmailAllowed = async (email: string): Promise<{ allowed: boolean; isAdmin?: boolean; tutorId?: string }> => {
    try {
      const response = await fetch(`/api/auth/check-tutor-email/${encodeURIComponent(email)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error checking tutor email:', error);
    }
    return { allowed: false };
  };

  // Fetch tutor profile if user is a tutor
  const fetchTutorProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/tutor-profiles/user/${userId}`);
      if (response.ok) {
        const profile = await response.json();
        setTutorProfile(profile);
        setUserRole('tutor');
        return profile;
      }
    } catch (error) {
      console.error('Error fetching tutor profile:', error);
    }
    return null;
  };

  // Fetch tutor profile by email (for Google OAuth tutors)
  const fetchTutorProfileByEmail = async (email: string) => {
    try {
      const response = await fetch(`/api/tutor-profiles/email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const profile = await response.json();
        setTutorProfile(profile);
        setUserRole('tutor');
        return profile;
      }
    } catch (error) {
      console.error('Error fetching tutor profile by email:', error);
    }
    return null;
  };

  const refreshTutorProfile = async () => {
    if (user) {
      await fetchTutorProfile(user.id);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // First check if user is a tutor by user ID
        let profile = await fetchTutorProfile(session.user.id);
        
        // If no profile by ID, check by email (for Google OAuth tutors)
        if (!profile && session.user.email) {
          profile = await fetchTutorProfileByEmail(session.user.email);
        }
        
        if (!profile) {
          // User is a student (Google OAuth user without tutor profile)
          setUserRole('student');
        }
      }
      
      // Check for admin session
      const adminSession = sessionStorage.getItem('adminSession');
      if (adminSession === 'true') {
        setIsAdmin(true);
        setUserRole('admin');
      }
      
      setLoading(false);
    });

    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Invalidate tutor profiles cache to ensure fresh data after auth change
      queryClient.invalidateQueries({ queryKey: ['/api/tutor-profiles'] });
      
      if (session?.user) {
        // First check if user is a tutor by user ID
        let profile = await fetchTutorProfile(session.user.id);
        
        // If no profile by ID, check by email (for Google OAuth tutors)
        if (!profile && session.user.email) {
          profile = await fetchTutorProfileByEmail(session.user.email);
        }
        
        if (!profile) {
          setUserRole('student');
        }
      } else {
        setTutorProfile(null);
        if (!isAdmin) {
          setUserRole(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with Google OAuth (for students)
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  // Sign in with Google OAuth (for tutors - redirects to tutor dashboard)
  const tutorSignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/tutor-dashboard`,
      },
    });
    if (error) {
      console.error('Error signing in with Google (tutor):', error.message);
    }
  };

  // Sign out the current user
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
    setTutorProfile(null);
    setUserRole(null);
    setIsAdmin(false);
    sessionStorage.removeItem('adminSession');
  };

  // Tutor sign up with email and password
  const tutorSignUp = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    try {
      // Create auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'tutor',
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: getAuthErrorMessage(error) };
      }

      if (data.user) {
        // Create tutor profile in our database
        const response = await fetch('/api/tutor-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUserId: data.user.id,
            email,
            fullName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { error: errorData.message || 'Failed to create tutor profile' };
        }

        const profile = await response.json();
        setTutorProfile(profile);
        setUserRole('tutor');
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  // Helper function to get user-friendly auth error message
  const getAuthErrorMessage = (error: { status?: number; message?: string; code?: string }): string => {
    // Use status codes first (more reliable than message matching)
    const status = error.status;
    const code = error.code;
    
    if (status === 400) {
      // Bad request - typically invalid credentials or validation error
      if (code === 'invalid_credentials' || error.message?.toLowerCase().includes('invalid')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
      if (code === 'email_not_confirmed' || error.message?.toLowerCase().includes('email not confirmed')) {
        return 'Please verify your email address. Check your inbox for a confirmation link.';
      }
      return 'Invalid request. Please check your information and try again.';
    }
    
    if (status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    
    if (status === 422) {
      // Unprocessable entity - validation errors
      if (error.message?.toLowerCase().includes('password')) {
        return 'Password does not meet requirements. Please use a stronger password.';
      }
      if (error.message?.toLowerCase().includes('email')) {
        return 'Please enter a valid email address.';
      }
      return 'Please check your information and try again.';
    }
    
    if (status === 429) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    
    // Fallback to message-based detection for edge cases
    const message = error.message?.toLowerCase() || '';
    if (message.includes('already registered') || message.includes('already exists')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('user not found')) {
      return 'No account found with this email. Please sign up first.';
    }
    
    // Return original message if no specific handling
    return error.message || 'An error occurred. Please try again.';
  };

  // Tutor sign in with email and password
  const tutorSignIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: getAuthErrorMessage(error) };
      }

      if (data.user) {
        const profile = await fetchTutorProfile(data.user.id);
        if (!profile) {
          // Sign out if no tutor profile exists
          await supabase.auth.signOut();
          return { error: 'No tutor account found for this email. Please sign up as a tutor first.' };
        }
        
        if (profile.isBlocked) {
          await supabase.auth.signOut();
          return { error: 'Your account has been blocked. Please contact support for assistance.' };
        }
      }

      return {};
    } catch (error) {
      console.error('Tutor sign-in error:', error);
      return { error: 'Unable to sign in. Please check your internet connection and try again.' };
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  // Admin sign in with server-side validation
  const adminSignIn = async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setUserRole('admin');
        sessionStorage.setItem('adminSession', 'true');
        if (data.token) {
          sessionStorage.setItem('adminToken', data.token);
        }
        return {};
      } else {
        const data = await response.json();
        return { error: data.message || 'Invalid admin credentials' };
      }
    } catch (error) {
      return { error: 'Failed to connect to server' };
    }
  };

  // Admin sign out
  const adminSignOut = async () => {
    const adminToken = sessionStorage.getItem('adminToken');
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
        });
      } catch (error) {
        console.error('Error during admin logout:', error);
      }
    }
    setIsAdmin(false);
    setUserRole(null);
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminToken');
  };

  // Get admin token for API calls
  const getAdminToken = (): string | null => {
    return sessionStorage.getItem('adminToken');
  };

  const value = {
    user,
    tutorProfile,
    userRole,
    loading,
    signInWithGoogle,
    tutorSignInWithGoogle,
    signOut,
    tutorSignUp,
    tutorSignIn,
    resetPassword,
    adminSignIn,
    adminSignOut,
    getAdminToken,
    isAdmin,
    refreshTutorProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
