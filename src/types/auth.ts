import type { User, Session } from '@supabase/supabase-js';

// Re-export Supabase auth types
export type { User, Session };

/**
 * Authentication state interface
 * Provides user session information and authentication methods
 */
export interface AuthState {
  /**
   * Currently authenticated user, or null if not authenticated
   */
  user: User | null;

  /**
   * Current session with tokens, or null if not authenticated
   */
  session: Session | null;

  /**
   * Loading state during authentication operations
   */
  loading: boolean;

  /**
   * Convenience flag indicating if user is authenticated
   */
  isAuthenticated: boolean;

  /**
   * Initiate Google OAuth sign-in flow
   * Redirects to Google authentication page
   * @throws Error if authentication fails
   */
  signInWithGoogle: () => Promise<void>;

  /**
   * Sign out current user and clear session
   * @throws Error if sign-out fails
   */
  signOut: () => Promise<void>;

  /**
   * Manually refresh the current session
   * Called automatically on 401 responses
   * @throws Error if refresh fails
   */
  refreshSession: () => Promise<void>;
}
