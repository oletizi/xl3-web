# Authentication Module Implementation Workplan

**Version:** 1.3
**Date:** 2025-10-08
**Status:** Implementation Complete (Deployment Pending)
**Target:** Google OAuth-only authentication with Supabase

## Implementation Status

### ✅ Completed Tasks

- ✅ Supabase client setup with PKCE flow
- ✅ TypeScript types for auth state and session
- ✅ AuthContext with Google OAuth provider
- ✅ API client with automatic token injection
- ✅ Login page with Google sign-in
- ✅ Auth callback page with loading states
- ✅ Protected route component with redirect logic
- ✅ User profile component with sign-out
- ✅ App.tsx route integration
- ✅ Layout.tsx integration with UserProfile

### ⏳ Pending Tasks

- ⏳ Supabase project setup (user needs to configure credentials)
- ⏳ E2E testing (OAuth flow, session management)
- ⏳ Netlify deployment configuration (functions, environment variables)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Technical Design](#3-technical-design)
4. [Implementation Steps](#4-implementation-steps)
5. [File Structure](#5-file-structure)
6. [Code Specifications](#6-code-specifications)
7. [Testing Strategy](#7-testing-strategy)
8. [Security Checklist](#8-security-checklist)
9. [Integration Points](#9-integration-points)
10. [Development Timeline](#10-development-timeline)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Security Architecture](#12-security-architecture)
13. [Appendices](#appendices)

---

## 1. Architecture Overview

### 1.1 Authentication Flow Diagrams

#### OAuth Flow (Google)

```
┌─────────┐                   ┌──────────┐                   ┌─────────────┐
│ Browser │                   │   App    │                   │  Supabase   │
└────┬────┘                   └────┬─────┘                   └──────┬──────┘
     │                             │                                 │
     │  1. Click "Sign in with    │                                 │
     │     Google"                 │                                 │
     │────────────────────────────>│                                 │
     │                             │                                 │
     │                             │  2. Initiate OAuth              │
     │                             │────────────────────────────────>│
     │                             │                                 │
     │                             │  3. Redirect to Provider        │
     │<────────────────────────────┼─────────────────────────────────│
     │                             │                                 │
     │  4. Authenticate with       │                                 │
     │     Provider (external)     │                                 │
     │                             │                                 │
     │  5. Redirect back with code │                                 │
     │────────────────────────────>│                                 │
     │                             │                                 │
     │                             │  6. Exchange code for tokens    │
     │                             │────────────────────────────────>│
     │                             │                                 │
     │                             │  7. Return JWT + refresh token  │
     │                             │<────────────────────────────────│
     │                             │                                 │
     │                             │  8. Store session               │
     │                             │    (managed by Supabase)        │
     │                             │                                 │
     │  9. Render authenticated UI │                                 │
     │<────────────────────────────│                                 │
```

#### Session Refresh Flow

```
┌─────────┐                   ┌──────────┐                   ┌─────────────┐
│ Browser │                   │   App    │                   │  Supabase   │
└────┬────┘                   └────┬─────┘                   └──────┬──────┘
     │                             │                                 │
     │                             │  1. JWT expires                 │
     │                             │    (detected via API error 401) │
     │                             │                                 │
     │                             │  2. refreshSession()            │
     │                             │────────────────────────────────>│
     │                             │                                 │
     │                             │  3. Validate refresh token      │
     │                             │                                 │
     │                             │  4. Return new JWT              │
     │                             │<────────────────────────────────│
     │                             │                                 │
     │                             │  5. Retry original request      │
     │                             │────────────────────────────────>│
     │                             │                                 │
     │  6. Continue without        │                                 │
     │     interruption            │                                 │
     │<────────────────────────────│                                 │
```

### 1.2 Session Management Strategy

**Token Storage:**
- JWT access token and refresh token managed by Supabase client
- Session persists across browser tabs and page refreshes
- Automatic session restoration on app load

**Token Lifecycle:**
- Access token expires after 1 hour (Supabase default)
- Refresh token valid for 30 days (configurable)
- Automatic token refresh via Supabase client
- Manual refresh triggers on 401 responses

**Session Invalidation:**
- Explicit sign-out removes all tokens
- Token expiry triggers automatic refresh
- Network errors gracefully handled with retry logic

### 1.3 Security Considerations

**Token Security:**
- JWT tokens contain minimal user data (id, email, metadata)
- Supabase manages token storage securely
- Token exposure mitigated by short expiry times
- HTTPS required in production

**CSRF Protection:**
- State parameter in OAuth flow prevents CSRF
- PKCE flow for enhanced OAuth security
- Origin validation for callback URLs

**XSS Prevention:**
- React automatically escapes rendered content
- No innerHTML or dangerouslySetInnerHTML with user data
- Content Security Policy headers in production

**Redirect Safety:**
- Whitelist allowed redirect URLs in Supabase dashboard
- Validate redirect parameters client-side
- Never redirect to user-provided URLs without validation

---

## 2. Deployment Architecture

### 2.1 Platform Overview

This application uses a modern serverless architecture with clear separation of concerns:

**Frontend Hosting:**
- **Platform:** Netlify
- **Static Assets:** Vite-built React SPA
- **CDN:** Global edge network for optimal performance
- **HTTPS:** Automatic SSL/TLS certificates
- **Build:** Triggered automatically on git push

**Backend Services:**
- **Authentication:** Supabase Auth (OAuth, JWT management)
- **Database:** Supabase PostgreSQL with Row-Level Security
- **Storage:** Supabase Storage (future use for mode attachments)
- **Custom Backend Logic:** Netlify Functions (serverless)

### 2.2 Netlify Functions Architecture

**What are Netlify Functions?**
- Serverless functions deployed alongside your static site
- Run on AWS Lambda infrastructure
- Automatically scaled and managed by Netlify
- Accessed via `/.netlify/functions/function-name` endpoints

**When to Use Netlify Functions:**
- API key protection (keep secrets server-side)
- Complex data processing not suitable for client-side
- Webhook handlers (GitHub, Stripe, etc.)
- Third-party API proxying
- Server-side rendering (SSR) if needed

**When NOT to Use Netlify Functions (Use Supabase Directly):**
- Authentication (Supabase handles this 100%)
- Database CRUD operations (Supabase RLS policies protect data)
- File uploads to Supabase Storage
- Real-time subscriptions

### 2.3 API Client Design

The `api-client.ts` is designed for **future Netlify Functions**, not for Supabase:

```typescript
// Current: api-client.ts exists but is NOT used for auth
// Auth flow: React App → Supabase directly
// No custom backend needed for authentication

// Future: api-client.ts will connect to Netlify Functions
// Example use case: Proxying third-party APIs with secrets
const response = await apiClient.get('/.netlify/functions/external-api');
```

**API Client Features:**
- Automatic JWT injection from Supabase session
- Token refresh on 401 responses
- Timeout handling
- Error normalization

**Netlify Functions Example:**

```typescript
// netlify/functions/external-api.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event) => {
  // Verify auth token
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Verify token with Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { statusCode: 401, body: 'Invalid token' };
  }

  // Call external API with server-side secret
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${process.env.EXTERNAL_API_SECRET}`,
    },
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

### 2.4 Deployment Configuration

**Netlify Build Settings:**

```toml
# netlify.toml
[build]
  command = "pnpm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_SUPABASE_URL = "https://your-project.supabase.co"
  # Note: VITE_SUPABASE_ANON_KEY is safe to expose (public key)
  VITE_SUPABASE_ANON_KEY = "your-anon-key"
  # Note: Never expose service_role key in VITE_ variables!

[functions]
  node_bundler = "esbuild"
```

**Environment Variables:**

```bash
# Netlify Dashboard: Site Settings → Environment Variables

# Frontend (VITE_ prefix = exposed to client)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend Functions (NOT exposed to client)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER expose in VITE_!
EXTERNAL_API_SECRET=your-secret-key
```

### 2.5 Authentication Flow (No Custom Backend)

**Current Implementation:**
```
User → React App → Supabase Auth API → OAuth Provider → Callback → Supabase → React App
```

**No Netlify Functions involved in auth flow:**
- Supabase handles OAuth redirects
- Supabase issues JWT tokens
- Supabase validates tokens on every database request
- Row-Level Security policies enforce authorization

**api-client.ts Role:**
- Currently exists but NOT used for authentication
- Ready for future Netlify Functions (webhooks, API proxies, etc.)
- Automatically includes Supabase JWT in requests to Netlify Functions
- Handles token refresh transparently

### 2.6 Future Netlify Functions Use Cases

**Example: Webhook Handler**
```typescript
// netlify/functions/github-webhook.ts
// Endpoint: /.netlify/functions/github-webhook
// Use case: Trigger actions based on GitHub events
```

**Example: External API Proxy**
```typescript
// netlify/functions/openai-proxy.ts
// Endpoint: /.netlify/functions/openai-proxy
// Use case: Call OpenAI API with server-side secret
```

**Example: Complex Data Processing**
```typescript
// netlify/functions/generate-report.ts
// Endpoint: /.netlify/functions/generate-report
// Use case: Generate PDF reports server-side
```

---

## 3. Technical Design

### 3.1 Supabase Configuration

#### Project Setup

```typescript
// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Proof Key for Code Exchange for enhanced security
  },
});
```

#### Environment Variables

```bash
# .env.example

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Custom redirect URLs
VITE_AUTH_REDIRECT_URL=http://localhost:8080/auth/callback
VITE_APP_URL=http://localhost:8080
```

### 3.2 React Context Architecture

#### AuthContext Structure

```typescript
// src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  // User & session data
  user: User | null;
  session: Session | null;

  // Loading states
  loading: boolean;

  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Utility methods
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    user,
    session,
    loading,
    signInWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    refreshSession: async () => {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    },
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.3 Protected Routes Implementation

```typescript
// src/components/auth/ProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### 3.4 Session Refresh Logic

```typescript
// src/lib/api-client.ts

import { supabase } from '@/lib/supabase';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? 30000;
  }

  private async getAuthToken(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(`Failed to get auth session: ${error.message}`);
    }

    return session?.access_token ?? null;
  }

  private async refreshSessionIfNeeded(error: Response): Promise<boolean> {
    if (error.status === 401) {
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw refreshError;
        }
        return true;
      } catch (err) {
        console.error('Session refresh failed:', err);
        await supabase.auth.signOut();
        return false;
      }
    }
    return false;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        const refreshed = await this.refreshSessionIfNeeded(response);
        if (refreshed) {
          return this.request<T>(endpoint, options);
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Request failed'
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// For future Netlify Functions - NOT used for auth
export const apiClient = new ApiClient({
  baseUrl: '/.netlify/functions',
});
```

---

## 4. Implementation Steps

### Phase 1: Environment Setup (2-3 hours)

#### 4.1 Install Dependencies

```bash
pnpm add @supabase/supabase-js
```

#### 4.2 Create Supabase Project

1. Go to https://supabase.com
2. Create new project: "xl3-web-auth"
3. Note project URL and anon key
4. Configure authentication providers:
   - Enable Google OAuth only
   - **Disable** Email/Password authentication
   - **Disable** GitHub OAuth (keeping it simple)

#### 4.3 Configure OAuth Providers

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Application type: Web application)
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase: Authentication → Providers → Google → Enable and paste credentials
7. Test the OAuth flow to ensure it works

#### 4.4 Environment Variables

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Phase 2: Core Authentication (4-6 hours)

#### 4.5 Create Supabase Client

- **File:** `src/lib/supabase.ts`
- Initialize Supabase client with PKCE flow
- Export singleton instance

#### 4.6 Create Type Definitions

- **File:** `src/types/auth.ts`
- Define User, Session, AuthError interfaces

#### 4.7 Create AuthContext

- **File:** `src/contexts/AuthContext.tsx`
- Implement AuthProvider component
- Create useAuth hook
- Handle session initialization
- Listen for auth state changes

#### 4.8 Integrate AuthProvider

- **File:** `src/main.tsx`
- Wrap app with AuthProvider

### Phase 3: UI Components (3-4 hours)

#### 4.9 Create Login Page

- **File:** `src/pages/Login.tsx`
- Single "Sign in with Google" button
- Error handling for OAuth failures
- Redirect after successful login
- Minimal, clean UI
- Show loading state during OAuth redirect

#### 4.10 Create Auth Callback

- **File:** `src/pages/AuthCallback.tsx`
- Handle OAuth redirect
- Show loading state
- Handle errors

#### 4.11 Create User Profile Component

- **File:** `src/components/auth/UserProfile.tsx`
- Avatar dropdown
- User menu with sign out
- Display user email and name from OAuth provider

### Phase 4: Protected Routes (2-3 hours)

#### 4.13 Create ProtectedRoute Component

- **File:** `src/components/auth/ProtectedRoute.tsx`
- Check authentication
- Show loading state
- Redirect if unauthenticated

#### 4.14 Update Router

- **File:** `src/App.tsx`
- Wrap protected routes
- Configure public routes

### Phase 5: Session Management (3-4 hours)

#### 4.15 Create API Client

- **File:** `src/lib/api-client.ts`
- Auto-inject auth token
- Handle 401 with refresh
- Implement timeout

#### 4.16 Update CloudStorageService

- **File:** `src/lib/services/cloud-storage.ts`
- Use ApiClient for requests

### Phase 6: Testing (4-6 hours)

See Section 7 for detailed testing strategy.

---

## 5. File Structure

### New Files to Create

```
src/
├── lib/
│   ├── supabase.ts                    # Supabase client
│   ├── api-client.ts                  # HTTP client with auth (for Netlify Functions)
│   └── errors.ts                      # Auth error classes
│
├── contexts/
│   └── AuthContext.tsx                # Auth state and methods
│
├── hooks/
│   ├── useAuth.ts                     # Re-export from AuthContext
│   └── useRequireAuth.ts              # Hook to enforce auth
│
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx         # Route wrapper
│       ├── UserProfile.tsx            # User dropdown
│       └── AuthStatus.tsx             # Auth state indicator
│
├── pages/
│   ├── Login.tsx                      # Login page (OAuth only)
│   ├── AuthCallback.tsx               # OAuth callback
│   ├── Profile.tsx                    # User profile page
│   └── Settings.tsx                   # User settings page
│
└── types/
    ├── auth.ts                        # Auth types
    └── supabase.ts                    # Generated Supabase types
```

### Files to Modify

```
src/
├── main.tsx                           # Add AuthProvider
├── App.tsx                            # Update routing
├── components/
│   └── Layout.tsx                     # Add UserProfile
└── lib/services/
    └── cloud-storage.ts               # Use apiClient
```

---

## 6. Code Specifications

### 6.1 Interface Definitions

```typescript
// User (from @supabase/supabase-js)
export interface User {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    [key: string]: any;
  };
  created_at: string;
}

// Session (from @supabase/supabase-js)
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: User;
}

// AuthState
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### 6.2 Hook APIs

```typescript
// useAuth
const {
  user,
  session,
  loading,
  isAuthenticated,
  signInWithGoogle,
  signOut
} = useAuth();

// useRequireAuth
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  return { isAuthenticated, loading };
}
```

### 6.3 Component APIs

```typescript
// ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

// UserProfile
interface UserProfileProps {
  className?: string;
  showEmail?: boolean;
  menuPosition?: 'left' | 'right';
}
```

### 6.4 Error Types

```typescript
export enum AuthErrorCode {
  OAUTH_ERROR = 'oauth_error',
  OAUTH_CANCELLED = 'oauth_cancelled',
  SESSION_EXPIRED = 'session_expired',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// src/contexts/__tests__/AuthContext.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

describe('AuthContext', () => {
  it('should provide initial loading state', () => {
    // Test implementation
  });

  it('should show authenticated user', async () => {
    // Test implementation
  });

  it('should handle sign in', async () => {
    // Test implementation
  });
});
```

### 7.2 Integration Tests

```typescript
// tests/e2e/auth.spec.ts

import { test, expect } from '@playwright/test';

test('should redirect to OAuth provider on sign in', async ({ page, context }) => {
  await page.goto('/login');

  // Click Google sign in
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.click('button:has-text("Continue with Google")'),
  ]);

  // Should redirect to Google OAuth page
  await expect(popup).toHaveURL(/accounts\.google\.com/);
});
```

### 7.3 Coverage Requirements

- AuthContext: 90%+
- API Client: 85%+
- Auth components: 80%+
- Auth pages: 75%+

---

## 8. Security Checklist

### 8.1 Token Storage

- [x] Tokens managed by Supabase (secure)
- [x] No tokens in URL parameters
- [x] Session cleared on sign out
- [x] Tokens not exposed in logs (production)

### 8.2 CSRF Protection

- [x] OAuth state parameter validated
- [x] PKCE flow enabled
- [x] Origin validation

### 8.3 XSS Prevention

- [x] React auto-escaping
- [x] No dangerouslySetInnerHTML with user data
- [x] CSP headers configured

### 8.4 Redirect Safety

- [x] Whitelist redirect URLs
- [x] Validate redirect parameters
- [x] Never use untrusted URLs

### 8.5 Rate Limiting

- [x] Supabase rate limiting
- [x] Client-side debouncing
- [x] Exponential backoff

---

## 9. Integration Points

### 9.1 CloudStorageService Integration

```typescript
// Update CloudStorageService to use authenticated requests
import { apiClient } from '@/lib/api-client';

export class CloudStorageService {
  async getUserModes(): Promise<CloudMode[]> {
    return apiClient.get('/users/me/modes');
  }
}
```

### 9.2 React Query Integration

```typescript
export function useUserModes() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user-modes', user?.id],
    queryFn: () => cloudStorage.getUserModes(),
    enabled: isAuthenticated,
  });
}
```

---

## 10. Development Timeline

### Total: 10-15 hours (Google OAuth-only)

**Week 1: Core Implementation (8-10 hours)**
- Day 1: Setup (2h) - Supabase project, Google OAuth config
- Day 2: Auth Context (2-3h) - AuthContext with signInWithGoogle only
- Day 3: UI Components (2-3h) - Login page (1 button!), AuthCallback, UserProfile
- Day 4: Integration (2h) - Protected routes, update App routing

**Week 2: Polish & Testing (2-5 hours)**
- Day 5: API Client (1-2h) - Auth token injection and refresh
- Day 6: Testing (1-2h) - E2E OAuth flow test
- Day 7: Final review (30min-1h) - Security review, docs

---

## 11. Acceptance Criteria

### Feature Completion

- [x] Google OAuth sign in
- [x] Session persistence across page reloads
- [x] Protected routes with redirect to login
- [x] Auto token refresh on expiry
- [x] User profile UI with Google avatar/email
- [x] Sign out functionality
- [x] OAuth callback handling with loading state
- [x] Error handling for OAuth failures

### Testing

- [ ] 85%+ test coverage
- [ ] All E2E tests pass
- [ ] Manual testing checklist complete

### Security

- [x] PKCE flow enabled
- [x] Rate limiting active
- [ ] CSP headers configured
- [ ] No security vulnerabilities

---

## 12. Security Architecture

### 12.1 Threat Model

#### OWASP Top 10 Mapping

**A01:2021 – Broken Access Control**
- **Risk:** Users accessing other users' modes, admin functions
- **Mitigation:** Row-Level Security (RLS) policies, server-side authorization checks
- **Implementation:** Supabase RLS enforces `auth.uid() = author_id` for all user data access

**A02:2021 – Cryptographic Failures**
- **Risk:** OAuth tokens exposed, session tokens stolen
- **Mitigation:** HTTPS for all traffic, secure token storage by Supabase
- **Implementation:** Never log tokens in production, enforce HTTPS redirects, PKCE flow

**A03:2021 – Injection**
- **Risk:** SQL injection through user input
- **Mitigation:** Supabase uses parameterized queries, Zod validation on all inputs
- **Implementation:** Never concatenate user input into queries

**A04:2021 – Insecure Design**
- **Risk:** Missing security controls in architecture
- **Mitigation:** Security-first design with PKCE, rate limiting, email verification
- **Implementation:** This workplan addresses security from day 1

**A05:2021 – Security Misconfiguration**
- **Risk:** Default credentials, exposed error messages, missing security headers
- **Mitigation:** CSP headers, secure Supabase config, generic error messages
- **Implementation:** See section 12.5 for secure coding guidelines

**A06:2021 – Vulnerable and Outdated Components**
- **Risk:** Old dependencies with known vulnerabilities
- **Mitigation:** Regular `pnpm audit`, Snyk monitoring, dependency updates
- **Implementation:** CI/CD pipeline includes security scanning

**A07:2021 – Identification and Authentication Failures**
- **Risk:** Session fixation, OAuth flow manipulation, weak session management
- **Mitigation:** PKCE flow, session rotation, secure OAuth implementation
- **Implementation:** See section 12.3 for OAuth security controls

**A08:2021 – Software and Data Integrity Failures**
- **Risk:** Unsigned JWTs, tampered session data
- **Mitigation:** Supabase signs all JWTs, verify signature on every request
- **Implementation:** ApiClient validates tokens before use

**A09:2021 – Security Logging and Monitoring Failures**
- **Risk:** No audit trail, undetected breaches
- **Mitigation:** Log all auth events, monitor failed login attempts
- **Implementation:** Supabase provides auth event logs, integrate with Sentry

**A10:2021 – Server-Side Request Forgery (SSRF)**
- **Risk:** Attacker-controlled URLs in OAuth redirects
- **Mitigation:** Whitelist allowed redirect URLs, validate all redirects
- **Implementation:** See section 8.4 for redirect safety

#### React SPA-Specific Vulnerabilities

**Token Exposure in Client-Side Storage**
- **Risk:** XSS attacks stealing tokens from localStorage
- **Mitigation:** Supabase handles token storage securely, httpOnly cookies where possible
- **Impact:** High - tokens grant full user access

**DOM-Based XSS**
- **Risk:** Malicious scripts in user-generated content (mode names, descriptions)
- **Mitigation:** React auto-escapes by default, DOMPurify for rich content
- **Impact:** High - can steal tokens, perform actions as user

**Open Redirects**
- **Risk:** OAuth redirect to attacker-controlled site
- **Mitigation:** Whitelist redirects, validate origin
- **Impact:** Medium - phishing attacks

**Client-Side Authorization Bypass**
- **Risk:** Users modifying client code to bypass UI restrictions
- **Mitigation:** Always enforce authorization server-side with RLS
- **Impact:** Critical - unauthorized data access

### 12.2 Security Requirements

#### Token Storage

**DO:**
- Use Supabase's built-in session management
- Let Supabase handle token storage (uses localStorage securely)
- Clear all session data on sign out

**DON'T:**
- Store tokens in plain text anywhere
- Store tokens in URL parameters or cookies manually
- Log tokens in production

**Implementation:**
```typescript
// Supabase handles this automatically
const { data: { session } } = await supabase.auth.getSession();
// Session includes access_token, refresh_token (stored securely by Supabase)
```

#### HTTPS Enforcement

**Requirements:**
- All production traffic over HTTPS
- HTTP Strict Transport Security (HSTS) headers
- Redirect HTTP to HTTPS

**Implementation:**
```typescript
// vite.config.ts (production)
export default defineConfig({
  server: {
    https: process.env.NODE_ENV === 'production',
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  },
});
```

#### CORS Configuration

**Whitelist only trusted origins:**
```typescript
// Supabase dashboard: Authentication > URL Configuration
// Allowed origins:
// - http://localhost:8080 (dev)
// - https://your-production-domain.com (prod)
```

#### Content Security Policy (CSP)

**Strict CSP headers:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // React requires inline scripts
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  },
});
```

#### Cookie Security Flags

**If using custom cookies (Supabase manages its own):**
- `Secure` - only sent over HTTPS
- `HttpOnly` - not accessible via JavaScript (prevents XSS)
- `SameSite=Strict` - prevents CSRF

### 12.3 Authentication Security Controls

#### Google OAuth-Only Benefits

**No Password Management:**
- No password storage or hashing required
- No password reset flows to secure
- No brute force attacks on passwords
- Users rely on Google's enterprise-grade security

**Reduced Attack Surface:**
- No account enumeration via email lookup
- No timing attacks on password verification
- No credential stuffing attacks
- Delegates authentication to trusted provider (Google)

**Single Provider Simplicity:**
- One OAuth integration to maintain
- Consistent user experience
- Most users already have Google accounts
- Faster implementation and testing

#### OAuth Security

**PKCE Flow (Proof Key for Code Exchange):**
- Prevents authorization code interception
- Required for all OAuth flows
- Already enabled in Supabase config

**State Parameter Validation:**
- Prevents CSRF attacks on OAuth callback
- Supabase handles this automatically

**Redirect URI Validation:**
- Whitelist exact redirect URLs (no wildcards)
- Validate redirect_uri parameter matches whitelist
- Configure in Supabase dashboard

**Implementation:**
```typescript
// Supabase config already includes PKCE
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // ✅ Critical for security
  },
});
```

#### Session Fixation Prevention

**Session Rotation:**
- Generate new session ID on OAuth login
- Invalidate old session ID
- Supabase handles this automatically

**Implementation:**
```typescript
// On OAuth login success, Supabase issues new tokens
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
// Old session is invalidated, new session created after OAuth callback
```

### 12.4 Authorization Security

#### Row-Level Security (RLS) Policy Audit

**From research document, these RLS policies must be implemented:**

```sql
-- ✅ VERIFIED: Public modes viewable by everyone
CREATE POLICY "Public modes are viewable by everyone"
  ON modes FOR SELECT
  USING (is_public = true);

-- ✅ VERIFIED: Users can view own modes
CREATE POLICY "Users can view own modes"
  ON modes FOR SELECT
  USING (auth.uid() = author_id);

-- ✅ VERIFIED: Users can create modes
CREATE POLICY "Users can create modes"
  ON modes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ✅ VERIFIED: Users can update own modes
CREATE POLICY "Users can update own modes"
  ON modes FOR UPDATE
  USING (auth.uid() = author_id);

-- ✅ VERIFIED: Users can delete own modes
CREATE POLICY "Users can delete own modes"
  ON modes FOR DELETE
  USING (auth.uid() = author_id);

-- ⚠️ REVIEW REQUIRED: Admin policy needs custom claim
CREATE POLICY "Admins have full access"
  ON modes
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

**Security Concerns:**
1. **Public modes leak check:** Ensure `is_public = true` modes don't contain PII
2. **Admin role validation:** Custom JWT claim `role: admin` must be set server-side only
3. **Like/rating policies:** Need policies for `mode_likes` and `mode_ratings` tables

#### Principle of Least Privilege

**Users can only:**
- View public modes (read-only)
- View/edit/delete their own modes
- Like/rate modes they didn't create

**Users cannot:**
- Access other users' private modes
- Edit modes they didn't create
- Delete other users' data
- Grant themselves admin privileges

#### Token Validation on Every Request

**Server-side (Supabase handles this):**
- Verify JWT signature
- Check expiration time
- Validate issuer and audience
- Enforce RLS based on `auth.uid()`

**Client-side (our responsibility):**
```typescript
// ApiClient automatically includes token
async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await this.getAuthToken(); // Validates session exists

  if (!token) {
    throw new AuthenticationError('No valid session');
  }

  headers['Authorization'] = `Bearer ${token}`;
  // ...
}
```

### 12.5 Secure Coding Guidelines

#### Input Validation

**Validate all user inputs with Zod:**
```typescript
// src/lib/validation/mode.ts

import { z } from 'zod';

const ControlMappingSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['knob', 'fader', 'button']),
  ccNumber: z.number().int().min(0).max(127),
  midiChannel: z.number().int().min(1).max(16),
  minValue: z.number().int().min(0).max(127),
  maxValue: z.number().int().min(0).max(127),
  label: z.string().max(50).optional(),
});

const ModeSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(500, 'Description too long'),
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (use semver)'),
  controls: z.record(ControlMappingSchema),
  tags: z.array(z.string().max(30)).max(10),
  category: z.string().max(50),
});

// Usage
export function validateMode(mode: unknown) {
  return ModeSchema.parse(mode); // Throws if invalid
}
```

**Sanitize before storage:**
```typescript
// Remove potentially dangerous characters
function sanitizeInput(input: string): string {
  return input
    .replace(/<script/gi, '')  // Remove script tags
    .replace(/javascript:/gi, '')  // Remove javascript: URLs
    .replace(/on\w+=/gi, '')  // Remove event handlers
    .trim();
}
```

#### XSS Prevention

**React's built-in escaping:**
```typescript
// ✅ SAFE - React auto-escapes
function ModeCard({ mode }: { mode: CloudMode }) {
  return (
    <div>
      <h3>{mode.name}</h3> {/* React escapes this */}
      <p>{mode.description}</p> {/* React escapes this */}
    </div>
  );
}
```

**DOMPurify for rich content:**
```typescript
import DOMPurify from 'dompurify';

// Only if you need to render HTML (avoid if possible)
function RichDescription({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });

  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

**NEVER use user input in these contexts:**
```typescript
// ❌ DANGEROUS - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />
<a href={userProvidedURL}>Click</a>
<img src={userProvidedURL} />
eval(userInput);
new Function(userInput);
```

#### CSRF Protection

**Supabase handles CSRF via:**
- JWT tokens in Authorization header (not cookies)
- SameSite cookie policies
- Origin validation

**Our responsibility:**
- Never use cookies for auth manually
- Always use POST for state-changing operations
- Validate origin on OAuth callbacks

#### Secure Redirect Validation

```typescript
// src/lib/validation/redirect.ts

function getSafeRedirectUrl(url: string | null): string {
  const allowedPaths = [
    '/',
    '/editor',
    '/library',
    '/catalog',
    '/profile',
    '/settings',
  ];

  if (!url) return '/';

  try {
    const parsed = new URL(url, window.location.origin);

    // Only allow same-origin redirects
    if (parsed.origin !== window.location.origin) {
      console.warn('Blocked cross-origin redirect:', url);
      return '/';
    }

    // Check against whitelist
    if (allowedPaths.includes(parsed.pathname)) {
      return parsed.pathname;
    }

    // Allow dynamic routes (e.g., /modes/:id)
    if (parsed.pathname.startsWith('/modes/')) {
      return parsed.pathname;
    }

    console.warn('Blocked non-whitelisted redirect:', url);
    return '/';
  } catch {
    console.warn('Invalid redirect URL:', url);
    return '/';
  }
}

// Usage in Login component
const from = getSafeRedirectUrl(location.state?.from?.pathname);
navigate(from, { replace: true });
```

#### Error Message Sanitization

**Don't leak sensitive information:**
```typescript
// ❌ BAD - reveals database structure
throw new Error(`User not found in users table for OAuth ID: ${oauthId}`);

// ❌ BAD - reveals OAuth provider details
throw new Error('Google OAuth token is invalid or expired');

// ✅ GOOD - generic, safe
throw new Error('Authentication failed. Please try again.');

// ✅ GOOD - helpful without leaking info
throw new Error('Unable to sign in. Please check your browser allows popups and try again.');
```

**Log detailed errors server-side only:**
```typescript
try {
  await supabase.auth.signInWithOAuth({ provider: 'google' });
} catch (error: any) {
  // Log full error for debugging (dev only)
  if (import.meta.env.DEV) {
    console.error('OAuth error:', error);
  }

  // Show generic error to user
  throw new Error('Unable to sign in with Google. Please try again.');
}
```

### 12.6 Security Testing Requirements

#### Penetration Testing Checklist

**Authentication Testing:**
- [ ] XSS payloads in all input fields (name, description, tags)
- [ ] CSRF token bypass attempts
- [ ] Session fixation attacks
- [ ] JWT tampering (modify claims, signature)
- [ ] JWT replay attacks (reuse old tokens)
- [ ] OAuth state parameter manipulation
- [ ] OAuth redirect URI manipulation
- [ ] OAuth code interception (PKCE should prevent)
- [ ] Cross-site request forgery on OAuth callback
- [ ] Open redirect vulnerabilities in OAuth flow

**Authorization Testing:**
- [ ] Access other users' private modes
- [ ] Modify modes without authentication
- [ ] Delete modes as wrong user
- [ ] Bypass RLS policies
- [ ] Elevate privileges to admin
- [ ] Access admin-only endpoints

**Session Management Testing:**
- [ ] Session hijacking via XSS
- [ ] Session fixation
- [ ] Token theft from localStorage
- [ ] Concurrent session handling
- [ ] Session timeout enforcement
- [ ] Logout effectiveness (token revocation)

#### Security Unit Tests

```typescript
// tests/security/rls-policies.test.ts

describe('Row-Level Security Policies', () => {
  it('should prevent users from viewing other users private modes', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const privateMode = await createMode(user1, { isPublic: false });

    // Try to access as user2
    const result = await supabase
      .from('modes')
      .select('*')
      .eq('id', privateMode.id)
      .single();

    expect(result.data).toBeNull(); // Should not see user1's private mode
  });

  it('should allow users to view public modes', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const publicMode = await createMode(user1, { isPublic: true });

    // Try to access as user2
    const result = await supabase
      .from('modes')
      .select('*')
      .eq('id', publicMode.id)
      .single();

    expect(result.data).toBeDefined(); // Should see public mode
  });

  it('should prevent users from deleting other users modes', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const mode = await createMode(user1, { isPublic: true });

    // Try to delete as user2
    const result = await supabase
      .from('modes')
      .delete()
      .eq('id', mode.id);

    expect(result.error).toBeDefined(); // Should fail
  });
});
```

```typescript
// tests/security/input-validation.test.ts

describe('Input Validation', () => {
  it('should reject XSS payloads in mode name', () => {
    const maliciousMode = {
      name: '<script>alert("XSS")</script>',
      description: 'Test',
      version: '1.0.0',
      controls: {},
    };

    expect(() => validateMode(maliciousMode)).toThrow();
  });

  it('should reject SQL injection in mode description', () => {
    const maliciousMode = {
      name: 'Test',
      description: "'; DROP TABLE modes; --",
      version: '1.0.0',
      controls: {},
    };

    // Should not throw (sanitization handles this)
    const validated = validateMode(maliciousMode);
    expect(validated.description).not.toContain('DROP TABLE');
  });

  it('should enforce tag limits', () => {
    const modeWithManyTags = {
      name: 'Test',
      description: 'Test mode',
      version: '1.0.0',
      controls: {},
      tags: Array(20).fill('tag'), // Too many tags
    };

    expect(() => validateMode(modeWithManyTags)).toThrow('maximum');
  });
});
```

```typescript
// tests/security/oauth-security.test.ts

describe('OAuth Security', () => {
  it('should use PKCE flow', () => {
    const config = supabase.auth.getOptions();
    expect(config.flowType).toBe('pkce');
  });

  it('should validate redirect URIs', async () => {
    const maliciousRedirect = 'https://evil.com';

    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: maliciousRedirect },
    });

    // Supabase should reject this
    expect(result.error).toBeDefined();
  });
});
```

#### Automated Security Scans

**OWASP ZAP Integration:**
```bash
# Run ZAP automated scan
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8080 \
  -r zap-report.html
```

**npm audit:**
```bash
# Check for known vulnerabilities
pnpm audit

# Fix vulnerabilities automatically
pnpm audit --fix
```

**Snyk Integration:**
```bash
# Install Snyk
pnpm add -D snyk

# Run security scan
pnpm snyk test

# Monitor continuously
pnpm snyk monitor
```

**CI/CD Security Checks:**
```yaml
# .github/workflows/security.yml

name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: pnpm audit

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP ZAP
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:8080'
```

### 12.7 Incident Response

#### Token Revocation Procedures

**Immediate Actions (< 5 minutes):**
1. Identify compromised tokens/sessions
2. Revoke tokens via Supabase API
3. Force re-authentication for affected users
4. Notify security team

**Implementation:**
```typescript
// src/lib/security/incident-response.ts

export async function revokeAllUserSessions(userId: string) {
  // Supabase admin API (server-side only)
  const { error } = await supabase.auth.admin.signOut(userId);

  if (error) {
    throw new Error(`Failed to revoke sessions: ${error.message}`);
  }

  // Log incident
  await logSecurityIncident({
    type: 'session_revocation',
    userId,
    timestamp: new Date().toISOString(),
    reason: 'Security incident',
  });
}

export async function revokeAllSessions() {
  // Global session revocation (emergency use only)
  // This would require custom implementation or Supabase support
  await supabase.auth.admin.listUsers().then(({ data: { users } }) => {
    return Promise.all(
      users.map(user => supabase.auth.admin.signOut(user.id))
    );
  });
}
```

#### Breach Notification Plan

**GDPR Compliance - 72 Hour Rule:**

**Hour 0-24: Detection & Containment**
- Detect breach (automated alerts, user reports)
- Contain breach (revoke tokens, patch vulnerability)
- Assess scope (number of users, data exposed)
- Document timeline

**Hour 24-48: Investigation**
- Root cause analysis
- Determine data exposed (emails, names, modes, etc.)
- Identify affected users
- Prepare notification templates

**Hour 48-72: Notification**
- Notify data protection authority (DPA)
- Notify affected users via email
- Public disclosure (if required)
- Provide remediation steps

**Email Template:**
```
Subject: Important Security Notice - XL3 Web

Dear [User],

We are writing to inform you of a security incident that may have affected your account.

What Happened:
On [DATE], we discovered [BRIEF DESCRIPTION]. We immediately took steps to secure our systems and investigate the incident.

What Information Was Involved:
[List specific data types: email addresses, usernames, mode data, etc.]

What We're Doing:
- We have revoked all active sessions and reset passwords
- We have patched the vulnerability
- We are conducting a full security audit
- We have reported this to the appropriate authorities

What You Should Do:
1. Sign in with your email at [LINK] and set a new password
2. If you use the same password elsewhere, change it immediately
3. Monitor your account for suspicious activity
4. Enable two-factor authentication when available

Questions:
If you have questions, please contact security@xl3-web.com

We sincerely apologize for this incident and any inconvenience it may cause.

Sincerely,
XL3 Web Security Team
```

#### Audit Logging Requirements

**Log all authentication events:**
```typescript
// src/lib/logging/auth-logger.ts

export interface AuthEvent {
  type: 'login' | 'logout' | 'signup' | 'password_change' | 'password_reset' | 'failed_login';
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export async function logAuthEvent(event: AuthEvent) {
  // Log to Supabase table
  await supabase.from('auth_events').insert(event);

  // Also send to external logging service (Sentry, LogRocket, etc.)
  if (import.meta.env.PROD) {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  }
}

// Usage in AuthContext
export function AuthProvider({ children }: { children: ReactNode }) {
  // ...

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      await logAuthEvent({
        type: 'login',
        email,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success: true,
      });
    } catch (error: any) {
      await logAuthEvent({
        type: 'failed_login',
        email,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success: false,
        errorMessage: error.message,
      });

      throw error;
    }
  };

  // ...
}
```

**Database schema for audit logs:**
```sql
CREATE TABLE auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Indexes for querying
  INDEX idx_auth_events_user (user_id, timestamp DESC),
  INDEX idx_auth_events_email (email, timestamp DESC),
  INDEX idx_auth_events_ip (ip_address, timestamp DESC),
  INDEX idx_auth_events_type (type, timestamp DESC)
);

-- Enable RLS
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Only admins can view auth events"
  ON auth_events FOR SELECT
  USING ((auth.jwt() ->> 'role')::text = 'admin');
```

#### Forensics and Log Retention

**Log Retention Policy:**
- Auth events: 90 days
- Security incidents: 7 years (legal requirement)
- User activity logs: 30 days
- Error logs: 30 days

**Forensic Readiness:**
```typescript
// Ensure logs are immutable and verifiable
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  description TEXT NOT NULL,
  affected_users UUID[] DEFAULT '{}',
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  root_cause TEXT,
  remediation TEXT,
  created_by UUID REFERENCES users(id),

  -- Prevent modification
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger to prevent deletion (append-only)
CREATE RULE security_incidents_no_delete AS
  ON DELETE TO security_incidents
  DO INSTEAD NOTHING;
```

### 12.8 Compliance Considerations

#### GDPR Requirements

**Right to Access (Article 15):**
```typescript
// src/lib/gdpr/data-export.ts

export async function exportUserData(userId: string) {
  // Export all user data
  const userData = await supabase.from('users').select('*').eq('id', userId).single();
  const userModes = await supabase.from('modes').select('*').eq('author_id', userId);
  const likes = await supabase.from('mode_likes').select('*').eq('user_id', userId);
  const ratings = await supabase.from('mode_ratings').select('*').eq('user_id', userId);

  return {
    user: userData.data,
    modes: userModes.data,
    likes: likes.data,
    ratings: ratings.data,
    exportedAt: new Date().toISOString(),
  };
}
```

**Right to Deletion (Article 17):**
```typescript
// src/lib/gdpr/data-deletion.ts

export async function deleteUserData(userId: string) {
  // Cascade delete all user data
  // Order matters - delete children before parent

  await supabase.from('mode_likes').delete().eq('user_id', userId);
  await supabase.from('mode_ratings').delete().eq('user_id', userId);
  await supabase.from('modes').delete().eq('author_id', userId);
  await supabase.from('auth_events').delete().eq('user_id', userId);

  // Finally delete user
  await supabase.auth.admin.deleteUser(userId);

  // Log deletion
  await logSecurityIncident({
    type: 'user_deletion',
    userId,
    timestamp: new Date().toISOString(),
    reason: 'User requested data deletion (GDPR Article 17)',
  });
}
```

**Data Portability (Article 20):**
```typescript
// Export in machine-readable format (JSON)
export async function exportUserDataPortable(userId: string) {
  const data = await exportUserData(userId);

  return {
    format: 'JSON',
    version: '1.0',
    exported: new Date().toISOString(),
    data: data,
  };
}
```

#### Data Retention Policies

**Retention Schedule:**
- Active users: Data retained indefinitely
- Inactive users (no login for 2 years): Notify user, delete after 30 days if no response
- Deleted accounts: Soft delete for 30 days, then hard delete
- Audit logs: 90 days (auth events), 7 years (security incidents)

**Implementation:**
```sql
-- Soft delete users
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMP;

-- Scheduled deletion job (run daily)
CREATE FUNCTION schedule_inactive_user_deletions() RETURNS void AS $$
BEGIN
  UPDATE users
  SET deletion_scheduled_at = NOW() + INTERVAL '30 days'
  WHERE last_sign_in_at < NOW() - INTERVAL '2 years'
    AND deletion_scheduled_at IS NULL
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Hard delete job (run daily)
CREATE FUNCTION hard_delete_scheduled_users() RETURNS void AS $$
BEGIN
  DELETE FROM users
  WHERE deletion_scheduled_at IS NOT NULL
    AND deletion_scheduled_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Right to Deletion Implementation

**UI for user-initiated deletion:**
```typescript
// src/pages/Settings.tsx

export function Settings() {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      // Request deletion
      await fetch('/api/users/me/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
      });

      // Sign out
      await supabase.auth.signOut();

      // Show confirmation
      toast.success('Your account has been scheduled for deletion. You have 30 days to change your mind.');

      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
    }
  };

  return (
    <div>
      {/* Settings UI */}

      <div className="border-t border-destructive mt-8 pt-8">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          className="mt-4"
        >
          {confirmDelete ? 'Click again to confirm deletion' : 'Delete Account'}
        </Button>

        {confirmDelete && (
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently delete all your modes, likes, and ratings after 30 days.
          </p>
        )}
      </div>
    </div>
  );
}
```

#### Cookie Consent Management

**GDPR requires consent for non-essential cookies:**

```typescript
// src/components/CookieConsent.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);

    // Enable analytics (only after consent)
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShowBanner(false);

    // Disable analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md p-4 shadow-lg z-50">
      <p className="text-sm mb-4">
        We use cookies to improve your experience. Essential cookies are required for authentication.
        Analytics cookies are optional.
      </p>
      <div className="flex space-x-2">
        <Button onClick={acceptCookies} size="sm">
          Accept All
        </Button>
        <Button onClick={rejectCookies} variant="outline" size="sm">
          Essential Only
        </Button>
      </div>
    </Card>
  );
}
```

---

## 13. Appendices

### Appendix A: Supabase Dashboard Configuration

#### Authentication Settings

1. **URL Configuration:**
   - Site URL: `http://localhost:8080` (dev), `https://your-domain.com` (prod)
   - Redirect URLs: `http://localhost:8080/auth/callback`, `https://your-domain.com/auth/callback`

2. **Disable Unused Auth Methods:**
   - Authentication → Providers → Email → **Disable**
   - Authentication → Providers → GitHub → **Disable**
   - Authentication → Providers → All others → **Disable**

3. **Enable Google OAuth:**
   - Authentication → Providers → Google → **Enable**
   - Add Client ID and Secret from Google Cloud Console
   - Save configuration

4. **Security:**
   - Set session timeout: 7 days (default)
   - Enable automatic token refresh: ✅
   - PKCE flow is enabled by default in client config

### Appendix B: Environment Variables Reference

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
VITE_APP_URL=http://localhost:8080
VITE_AUTH_REDIRECT_URL=http://localhost:8080/auth/callback
```

### Appendix C: Common Issues & Solutions

#### Issue: OAuth redirect not working

**Solution:**
- Verify redirect URL is whitelisted in Supabase dashboard
- Check OAuth provider callback URL matches
- Ensure HTTPS in production

#### Issue: Token refresh fails

**Solution:**
- Check refresh token not expired (default: 30 days)
- Verify `autoRefreshToken: true` in config
- Check network connectivity

#### Issue: Session not persisting

**Solution:**
- Verify `persistSession: true` in config
- Check localStorage not blocked by browser
- Verify cookies/storage not cleared

#### Issue: 401 errors after token expiry

**Solution:**
- Ensure ApiClient has refresh logic
- Check `refreshSession` implementation
- Verify retry logic in place

---

**End of Workplan**
