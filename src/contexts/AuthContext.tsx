import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, User, Session } from '@/types/auth';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component
 * Manages authentication state and provides auth methods to the application
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Initiate Google OAuth sign-in flow
   */
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(`Google sign-in failed: ${error.message}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during sign-in';
      console.error('Sign-in error:', message);
      throw new Error(message);
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(`Sign-out failed: ${error.message}`);
      }

      // Clear local state
      setUser(null);
      setSession(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during sign-out';
      console.error('Sign-out error:', message);
      throw new Error(message);
    }
  };

  /**
   * Manually refresh the current session
   */
  const refreshSession = async (): Promise<void> => {
    try {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        throw new Error(`Session refresh failed: ${error.message}`);
      }

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during session refresh';
      console.error('Session refresh error:', message);
      throw new Error(message);
    }
  };

  const value: AuthState = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
