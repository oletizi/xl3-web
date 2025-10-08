# Cloud Storage & Sharing - Architecture Research

**Version:** 1.0
**Date:** 2025-10-08
**Status:** Planning

## Executive Summary

This document outlines the architecture for implementing cloud-based mode storage and a global catalog for sharing custom MIDI controller modes. The system will enable users to store their custom modes in the cloud, discover community-created modes, and collaborate through forking and remixing.

## Current System Analysis

### Existing Architecture

**Frontend Stack:**
- React 18.3 + TypeScript 5.8
- Vite 5.4 build system
- TanStack Query 5.83 (already available!)
- shadcn/ui components
- React Router 6.30

**Current Storage:**
- Local storage for active mode (`LocalStorageManager`)
- File-based export/import (`fileStorage.ts`)
- State persistence (`statePersistence.ts`)

**Data Model:**
```typescript
interface CustomMode {
  name: string;
  description: string;
  version: string;
  controls: Record<string, ControlMapping>;
  createdAt: string;
  modifiedAt: string;
}
```

**UI Components:**
- `/pages/Catalog.tsx` - Mock UI for browsing community modes
- `/pages/Library.tsx` - Mock UI for user's personal library
- `/pages/Editor.tsx` - Mode editing interface

### Gap Analysis

**Missing Components:**
1. Cloud storage backend
2. Authentication system
3. API service layer
4. Sync manager for conflict resolution
5. Search and discovery infrastructure
6. User engagement tracking (likes, ratings, downloads)
7. Version history management

---

## Proposed Architecture

### 1. Data Model Extensions

#### CloudMode Interface

```typescript
interface CloudMode extends CustomMode {
  // Unique identification
  id: string;                    // UUID v4

  // Ownership & attribution
  authorId: string;              // Auth provider user ID
  authorName: string;            // Display name
  authorAvatar?: string;         // Profile image URL

  // Visibility & access
  isPublic: boolean;             // Public catalog visibility
  isOfficial: boolean;           // Curated by platform
  isFeatured: boolean;           // Featured on homepage

  // Engagement metrics
  downloads: number;             // Total download count
  likes: number;                 // Like count
  likesUserIds: string[];        // For checking if user liked
  rating: number;                // Average rating (1-5)
  ratingCount: number;           // Number of ratings
  views: number;                 // View count

  // Discovery & organization
  tags: string[];                // Searchable tags
  category: string;              // Primary category
  categories: string[];          // Multiple categories
  thumbnail?: string;            // Preview image (base64 or URL)

  // Version management
  versionHistory: ModeVersion[]; // Historical versions
  parentModeId?: string;         // Original mode (for forks)
  forkCount: number;             // Number of forks

  // Metadata
  publishedAt?: string;          // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  lastSyncedAt?: string;         // Last cloud sync
}

interface ModeVersion {
  version: string;               // Semver (1.0.0)
  changes: string;               // Changelog
  publishedAt: string;           // ISO 8601 timestamp
  downloadUrl?: string;          // Version-specific download
}

interface ModeMetadata {
  description: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  thumbnail?: string;
}
```

#### Database Schema (PostgreSQL)

```sql
-- Users table (managed by auth provider)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modes table
CREATE TABLE modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL,

  -- Mode data (JSONB for flexibility)
  controls JSONB NOT NULL,

  -- Visibility
  is_public BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Engagement
  downloads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,

  -- Discovery
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  thumbnail TEXT,

  -- Relationships
  parent_mode_id UUID REFERENCES modes(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,

  -- Indexes
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_modes_author ON modes(author_id);
CREATE INDEX idx_modes_public ON modes(is_public) WHERE is_public = true;
CREATE INDEX idx_modes_featured ON modes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_modes_category ON modes(category);
CREATE INDEX idx_modes_tags ON modes USING GIN(tags);
CREATE INDEX idx_modes_created ON modes(created_at DESC);

-- Full-text search
CREATE INDEX idx_modes_search ON modes USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Mode likes (many-to-many)
CREATE TABLE mode_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode_id UUID REFERENCES modes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, mode_id)
);

CREATE INDEX idx_mode_likes_mode ON mode_likes(mode_id);

-- Mode ratings
CREATE TABLE mode_ratings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode_id UUID REFERENCES modes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, mode_id)
);

-- Version history
CREATE TABLE mode_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id UUID REFERENCES modes(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  changes TEXT,
  controls JSONB NOT NULL,
  published_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mode_versions_mode ON mode_versions(mode_id, published_at DESC);

-- Categories (predefined)
CREATE TABLE categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0
);

-- Insert default categories
INSERT INTO categories (id, name, description) VALUES
  ('daw-control', 'DAW Control', 'Digital Audio Workstation control surfaces'),
  ('live-performance', 'Live Performance', 'Setups for live shows and DJing'),
  ('mixing-mastering', 'Mixing & Mastering', 'Studio mixing and mastering workflows'),
  ('instrument-control', 'Instrument Control', 'Hardware synth and instrument mappings'),
  ('genre-specific', 'Genre-Specific', 'Genre-optimized configurations'),
  ('educational', 'Educational', 'Learning and tutorial modes');
```

---

### 2. Backend Architecture

#### Recommended: Supabase (Serverless)

**Rationale:**
- Built on PostgreSQL (robust, relational)
- Real-time subscriptions out of the box
- Integrated authentication (OAuth + email)
- Object storage for large files
- Row-level security (RLS) for fine-grained access
- RESTful API auto-generated from schema
- Generous free tier: 500MB database, 1GB storage, 2GB bandwidth/month

**Stack:**
- **Database:** PostgreSQL 15+
- **Auth:** Supabase Auth (Google, GitHub, Email)
- **Storage:** Supabase Storage (for thumbnails, large mode files)
- **API:** Auto-generated REST + PostgREST
- **Real-time:** WebSocket subscriptions
- **Edge Functions:** Deno runtime for custom logic

**Alternative: Custom Backend**
- **Runtime:** Bun + Hono/Fastify
- **Database:** PostgreSQL + Drizzle ORM
- **Cache:** Redis for session/query caching
- **Storage:** Cloudflare R2 (S3-compatible, zero egress fees)
- **Auth:** Clerk or Auth0
- **Search:** Typesense or Meilisearch

---

### 3. API Design

#### RESTful Endpoints

```typescript
// Base URL: https://api.xl3-web.com/v1

/**
 * Public Catalog (No Auth Required)
 */

// Browse modes with filtering
GET /modes?
  category=daw-control&
  tags=ableton,live&
  sort=downloads|likes|rating|recent&
  page=1&
  limit=20

Response: {
  data: CloudMode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

// Get specific mode
GET /modes/:id
Response: CloudMode

// Search modes
GET /modes/search?q=ableton+live&filters={...}
Response: { data: CloudMode[]; meta: SearchMeta }

// Get mode versions
GET /modes/:id/versions
Response: ModeVersion[]

// Download mode (increments counter)
GET /modes/:id/download
Response: CustomMode (with analytics tracking)

// Get categories
GET /categories
Response: Category[]

// Get popular tags
GET /tags?limit=50
Response: { tag: string; count: number }[]

/**
 * User Library (Auth Required)
 */

// Get user's modes
GET /users/me/modes
Response: CloudMode[]

// Create/upload new mode
POST /modes
Body: {
  mode: CustomMode;
  metadata: ModeMetadata;
}
Response: CloudMode

// Update mode
PUT /modes/:id
Body: Partial<CloudMode>
Response: CloudMode

// Delete mode
DELETE /modes/:id
Response: { success: boolean }

// Publish mode (make public)
POST /modes/:id/publish
Response: CloudMode

// Unpublish mode (make private)
POST /modes/:id/unpublish
Response: CloudMode

/**
 * Engagement (Auth Required)
 */

// Like/unlike mode
POST /modes/:id/like
Response: { liked: boolean; likesCount: number }

// Rate mode
POST /modes/:id/rate
Body: { rating: number } // 1-5
Response: { averageRating: number; ratingCount: number }

// Fork mode
POST /modes/:id/fork
Body: { name?: string; description?: string }
Response: CloudMode (new forked mode)

/**
 * User Profile
 */

// Get user profile
GET /users/:userId
Response: UserProfile

// Get user's public modes
GET /users/:userId/modes
Response: CloudMode[]

// Update own profile
PATCH /users/me
Body: Partial<UserProfile>
Response: UserProfile
```

#### GraphQL Alternative (Future Consideration)

```graphql
type Query {
  modes(filters: ModeFilters, pagination: Pagination): ModesConnection!
  mode(id: ID!): Mode
  myModes: [Mode!]!
  categories: [Category!]!
  search(query: String!, filters: SearchFilters): SearchResults!
}

type Mutation {
  createMode(input: CreateModeInput!): Mode!
  updateMode(id: ID!, input: UpdateModeInput!): Mode!
  deleteMode(id: ID!): Boolean!
  publishMode(id: ID!): Mode!
  likeMode(id: ID!): LikeResult!
  rateMode(id: ID!, rating: Int!): RatingResult!
  forkMode(id: ID!, input: ForkModeInput): Mode!
}

type Subscription {
  modeUpdated(id: ID!): Mode!
  newFeaturedMode: Mode!
}
```

---

### 4. Frontend Architecture

#### Service Layer

```typescript
// src/lib/services/cloud-storage.ts

import { QueryClient } from '@tanstack/react-query';

interface ModeFilters {
  category?: string;
  tags?: string[];
  sort?: 'downloads' | 'likes' | 'rating' | 'recent';
  page?: number;
  limit?: number;
}

export class CloudStorageService {
  constructor(
    private baseUrl: string,
    private authToken?: string
  ) {}

  // Catalog operations
  async browseModes(filters: ModeFilters = {}): Promise<PaginatedResponse<CloudMode>> {
    const query = new URLSearchParams(filters as any).toString();
    const response = await fetch(`${this.baseUrl}/modes?${query}`);
    if (!response.ok) throw new Error('Failed to fetch modes');
    return response.json();
  }

  async getModeById(id: string): Promise<CloudMode> {
    const response = await fetch(`${this.baseUrl}/modes/${id}`);
    if (!response.ok) throw new Error('Mode not found');
    return response.json();
  }

  async searchModes(query: string, filters?: ModeFilters): Promise<CloudMode[]> {
    const params = new URLSearchParams({ q: query, ...filters as any });
    const response = await fetch(`${this.baseUrl}/modes/search?${params}`);
    if (!response.ok) throw new Error('Search failed');
    const result = await response.json();
    return result.data;
  }

  // Library operations (authenticated)
  async getUserModes(): Promise<CloudMode[]> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/users/me/modes`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user modes');
    return response.json();
  }

  async uploadMode(mode: CustomMode, metadata: ModeMetadata): Promise<CloudMode> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ mode, metadata }),
    });
    if (!response.ok) throw new Error('Failed to upload mode');
    return response.json();
  }

  async updateMode(id: string, updates: Partial<CloudMode>): Promise<CloudMode> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update mode');
    return response.json();
  }

  async deleteMode(id: string): Promise<void> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to delete mode');
  }

  // Engagement
  async likeMode(id: string): Promise<{ liked: boolean; likesCount: number }> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes/${id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    if (!response.ok) throw new Error('Failed to like mode');
    return response.json();
  }

  async rateMode(id: string, rating: number): Promise<{ averageRating: number }> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes/${id}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ rating }),
    });
    if (!response.ok) throw new Error('Failed to rate mode');
    return response.json();
  }

  async downloadMode(id: string): Promise<CustomMode> {
    const response = await fetch(`${this.baseUrl}/modes/${id}/download`);
    if (!response.ok) throw new Error('Failed to download mode');
    return response.json();
  }

  async forkMode(id: string, overrides?: { name?: string; description?: string }): Promise<CloudMode> {
    this.requireAuth();
    const response = await fetch(`${this.baseUrl}/modes/${id}/fork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(overrides || {}),
    });
    if (!response.ok) throw new Error('Failed to fork mode');
    return response.json();
  }

  private requireAuth() {
    if (!this.authToken) {
      throw new Error('Authentication required');
    }
  }
}
```

#### React Query Hooks

```typescript
// src/hooks/useCloudStorage.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudStorageService } from '@/lib/services/cloud-storage';
import { useAuth } from '@/hooks/useAuth';

const cloudStorage = new CloudStorageService(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
);

export function useCatalogModes(filters?: ModeFilters) {
  return useQuery({
    queryKey: ['catalog-modes', filters],
    queryFn: () => cloudStorage.browseModes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useModeById(id: string) {
  return useQuery({
    queryKey: ['mode', id],
    queryFn: () => cloudStorage.getModeById(id),
    enabled: !!id,
  });
}

export function useSearchModes(query: string, filters?: ModeFilters) {
  return useQuery({
    queryKey: ['search-modes', query, filters],
    queryFn: () => cloudStorage.searchModes(query, filters),
    enabled: query.length > 2,
  });
}

export function useUserModes() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ['user-modes', user?.id],
    queryFn: () => {
      cloudStorage.authToken = token;
      return cloudStorage.getUserModes();
    },
    enabled: !!user,
  });
}

export function useUploadMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: { mode: CustomMode; metadata: ModeMetadata }) => {
      cloudStorage.authToken = token;
      return cloudStorage.uploadMode(data.mode, data.metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-modes'] });
    },
  });
}

export function useUpdateMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: { id: string; updates: Partial<CloudMode> }) => {
      cloudStorage.authToken = token;
      return cloudStorage.updateMode(data.id, data.updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mode', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['user-modes'] });
    },
  });
}

export function useDeleteMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      cloudStorage.authToken = token;
      return cloudStorage.deleteMode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-modes'] });
    },
  });
}

export function useLikeMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      cloudStorage.authToken = token;
      return cloudStorage.likeMode(id);
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['mode', id] });
      const previousMode = queryClient.getQueryData<CloudMode>(['mode', id]);

      if (previousMode) {
        queryClient.setQueryData<CloudMode>(['mode', id], {
          ...previousMode,
          likes: previousMode.likes + 1,
        });
      }

      return { previousMode };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousMode) {
        queryClient.setQueryData(['mode', id], context.previousMode);
      }
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['mode', id] });
    },
  });
}

export function useRateMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: { id: string; rating: number }) => {
      cloudStorage.authToken = token;
      return cloudStorage.rateMode(data.id, data.rating);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mode', variables.id] });
    },
  });
}

export function useDownloadMode() {
  return useMutation({
    mutationFn: (id: string) => cloudStorage.downloadMode(id),
  });
}

export function useForkMode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data: { id: string; overrides?: any }) => {
      cloudStorage.authToken = token;
      return cloudStorage.forkMode(data.id, data.overrides);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-modes'] });
    },
  });
}
```

---

### 5. Sync Strategy

#### Offline-First Architecture

```typescript
// src/lib/sync/sync-manager.ts

interface SyncState {
  lastSyncAt?: string;
  pendingUploads: PendingSync[];
  conflicts: ConflictResolution[];
}

interface PendingSync {
  modeId: string;
  operation: 'create' | 'update' | 'delete';
  data: CustomMode | Partial<CustomMode>;
  timestamp: string;
}

interface ConflictResolution {
  localMode: CustomMode;
  remoteMode: CloudMode;
  strategy: 'local-wins' | 'remote-wins' | 'manual' | 'merge';
}

export class SyncManager {
  constructor(
    private localStorage: LocalStorageManager,
    private cloudStorage: CloudStorageService,
    private queryClient: QueryClient
  ) {}

  async sync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: false, reason: 'offline' };
    }

    try {
      // 1. Upload pending changes
      await this.uploadPendingChanges();

      // 2. Download remote updates
      const remoteModesCheck = await this.cloudStorage.getUserModes();

      // 3. Detect conflicts
      const conflicts = await this.detectConflicts(remoteModes);

      // 4. Resolve conflicts
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts);
      }

      // 5. Update local cache
      this.queryClient.setQueryData(['user-modes'], remoteModes);

      return { success: true, syncedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, reason: error.message };
    }
  }

  private async detectConflicts(remoteModes: CloudMode[]): Promise<ConflictResolution[]> {
    const conflicts: ConflictResolution[] = [];
    const localModes = await this.getLocalModes();

    for (const localMode of localModes) {
      const remoteMode = remoteModes.find(m => m.id === localMode.id);

      if (remoteMode) {
        const localModified = new Date(localMode.modifiedAt);
        const remoteModified = new Date(remoteMode.modifiedAt);

        if (localModified > remoteModified && remoteModified > lastSyncAt) {
          // Both modified since last sync - conflict!
          conflicts.push({
            localMode,
            remoteMode,
            strategy: 'manual', // Prompt user
          });
        }
      }
    }

    return conflicts;
  }

  private async resolveConflicts(conflicts: ConflictResolution[]): Promise<void> {
    for (const conflict of conflicts) {
      switch (conflict.strategy) {
        case 'local-wins':
          await this.cloudStorage.updateMode(conflict.localMode.id, conflict.localMode);
          break;

        case 'remote-wins':
          await this.localStorage.save(conflict.remoteMode);
          break;

        case 'merge':
          const merged = this.mergeControls(conflict.localMode, conflict.remoteMode);
          await this.cloudStorage.updateMode(merged.id, merged);
          await this.localStorage.save(merged);
          break;

        case 'manual':
          // Emit event for UI to handle
          this.emitConflictEvent(conflict);
          break;
      }
    }
  }

  private mergeControls(local: CustomMode, remote: CloudMode): CustomMode {
    // Strategy: Merge control mappings, prefer local for conflicts
    const mergedControls = {
      ...remote.controls,
      ...local.controls,
    };

    return {
      ...remote,
      controls: mergedControls,
      modifiedAt: new Date().toISOString(),
      version: this.incrementVersion(remote.version),
    };
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
}
```

---

### 6. Security Model

#### Authentication

```typescript
// Supabase Auth configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Sign in with OAuth
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// Sign in with email
async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
}
```

#### Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_ratings ENABLE ROW LEVEL SECURITY;

-- Public modes are readable by everyone
CREATE POLICY "Public modes are viewable by everyone"
  ON modes FOR SELECT
  USING (is_public = true);

-- Users can view their own modes
CREATE POLICY "Users can view own modes"
  ON modes FOR SELECT
  USING (auth.uid() = author_id);

-- Users can create modes
CREATE POLICY "Users can create modes"
  ON modes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own modes
CREATE POLICY "Users can update own modes"
  ON modes FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own modes
CREATE POLICY "Users can delete own modes"
  ON modes FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can do everything (set via custom claim)
CREATE POLICY "Admins have full access"
  ON modes
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

#### Content Moderation

```typescript
// Basic profanity filter
import { badWords } from '@/lib/moderation/bad-words';

function moderateContent(text: string): { clean: boolean; reason?: string } {
  const lowerText = text.toLowerCase();

  for (const word of badWords) {
    if (lowerText.includes(word)) {
      return { clean: false, reason: 'Inappropriate language detected' };
    }
  }

  return { clean: true };
}

// Server-side validation
async function createMode(mode: CustomMode, metadata: ModeMetadata) {
  const nameCheck = moderateContent(mode.name);
  if (!nameCheck.clean) {
    throw new Error(`Mode name rejected: ${nameCheck.reason}`);
  }

  const descCheck = moderateContent(metadata.description);
  if (!descCheck.clean) {
    throw new Error(`Description rejected: ${descCheck.reason}`);
  }

  // Proceed with creation
  return await db.insert(modes).values({...});
}
```

---

### 7. Implementation Roadmap

#### Phase 1: Foundation (2 weeks)

**Week 1: Backend Setup**
- [ ] Create Supabase project
- [ ] Design and implement database schema
- [ ] Set up row-level security policies
- [ ] Configure authentication providers (Google, GitHub, Email)
- [ ] Create API endpoints (REST via PostgREST)

**Week 2: Frontend Integration**
- [ ] Add authentication UI components
- [ ] Implement `CloudStorageService` class
- [ ] Create React Query hooks for cloud operations
- [ ] Update `CustomMode` type with cloud metadata
- [ ] Add environment variables for API configuration

**Deliverables:**
- Working authentication flow
- Basic mode upload/download
- User can see their own modes in the cloud

---

#### Phase 2: Library Sync (2 weeks)

**Week 3: Sync Manager**
- [ ] Implement `SyncManager` class
- [ ] Add offline detection
- [ ] Create pending operations queue
- [ ] Implement conflict detection
- [ ] Build conflict resolution UI

**Week 4: Library Integration**
- [ ] Update Library page to show cloud modes
- [ ] Add sync status indicator
- [ ] Implement manual sync button
- [ ] Add offline mode indicator
- [ ] Create mode version history UI

**Deliverables:**
- Seamless sync between local and cloud
- Conflict resolution flow
- Version history viewer

---

#### Phase 3: Public Catalog (2 weeks)

**Week 5: Catalog Backend**
- [ ] Implement search indexing
- [ ] Add filtering and sorting endpoints
- [ ] Create category management
- [ ] Build tag system
- [ ] Add analytics tracking (views, downloads)

**Week 6: Catalog UI**
- [ ] Update Catalog page with real data
- [ ] Implement search functionality
- [ ] Add category filtering
- [ ] Create mode detail view
- [ ] Build featured modes section

**Deliverables:**
- Fully functional public catalog
- Search and discovery features
- Mode detail pages

---

#### Phase 4: Engagement (2 weeks)

**Week 7: Engagement Features**
- [ ] Implement like system
- [ ] Add rating system (1-5 stars)
- [ ] Create fork/remix functionality
- [ ] Build user profiles
- [ ] Add activity feed

**Week 8: Social Features**
- [ ] Add comments on modes
- [ ] Implement follow system
- [ ] Create notifications
- [ ] Build trending algorithm
- [ ] Add share functionality

**Deliverables:**
- Social engagement features
- User profiles and activity
- Trending modes

---

#### Phase 5: Polish (2 weeks)

**Week 9: Performance & UX**
- [ ] Implement caching strategies
- [ ] Add skeleton loaders
- [ ] Optimize image loading
- [ ] Implement pagination
- [ ] Add error boundaries

**Week 10: Analytics & Admin**
- [ ] Build admin dashboard
- [ ] Add analytics tracking
- [ ] Create moderation tools
- [ ] Implement reporting system
- [ ] Add usage metrics

**Deliverables:**
- Production-ready system
- Admin tools
- Analytics dashboard

---

### 8. Technology Stack

#### Backend (Supabase)
```json
{
  "platform": "Supabase",
  "database": "PostgreSQL 15+",
  "auth": "Supabase Auth (JWT)",
  "storage": "Supabase Storage",
  "api": "PostgREST (auto-generated REST)",
  "realtime": "WebSocket subscriptions",
  "edge-functions": "Deno runtime"
}
```

#### Frontend (Existing + New)
```json
{
  "framework": "React 18.3 + TypeScript 5.8",
  "build": "Vite 5.4",
  "state": {
    "server": "@tanstack/react-query 5.83",
    "local": "React hooks + Context"
  },
  "ui": "shadcn/ui + Tailwind CSS",
  "routing": "React Router 6.30",
  "forms": "react-hook-form + zod",
  "http": "fetch API (built-in)"
}
```

#### Development Tools
```json
{
  "testing": {
    "e2e": "Playwright",
    "unit": "Vitest (to be added)",
    "integration": "Playwright + Supabase test database"
  },
  "ci-cd": "GitHub Actions",
  "monitoring": {
    "errors": "Sentry",
    "analytics": "PostHog or Plausible",
    "performance": "Web Vitals"
  }
}
```

---

### 9. Cost Analysis

#### Development Phase (Free)
- Supabase Free Tier:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth/month
  - 50,000 monthly active users
- Total: **$0/month**

#### MVP Launch (< 1,000 users)
- Supabase Free Tier: **$0**
- Domain: **$12/year**
- Total: **~$1/month**

#### Growth Phase (< 10,000 users)
- Supabase Pro: **$25/month**
  - 8GB database
  - 100GB storage
  - 250GB bandwidth
- Domain: **$1/month**
- Total: **$26/month**

#### Scale Phase (< 100,000 users)
- Supabase Pro: **$25/month**
- Additional database: **~$10/month**
- Additional bandwidth: **~$20/month**
- CDN (Cloudflare): **$0** (free tier)
- Monitoring (Sentry): **$26/month**
- Total: **~$81/month**

---

### 10. Risk Assessment

#### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase vendor lock-in | High | Medium | Use abstraction layer; PostgreSQL is portable |
| Data loss/corruption | Critical | Low | Automated backups; versioning |
| API rate limits | Medium | Medium | Implement caching; use CDN |
| Scalability issues | High | Low | Monitor performance; upgrade plan proactively |
| Security breach | Critical | Low | RLS policies; regular audits; penetration testing |

#### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low user adoption | High | Medium | Marketing; community building; quality content |
| Abuse/spam | Medium | Medium | Content moderation; rate limiting |
| Copyright issues | High | Low | DMCA process; terms of service |
| Hosting costs exceed budget | Medium | Low | Monitor usage; optimize storage |

---

### 11. Success Metrics

#### Key Performance Indicators (KPIs)

**User Engagement:**
- Monthly Active Users (MAU)
- Average session duration
- Modes created per user
- Return rate (7-day, 30-day)

**Content Metrics:**
- Total modes in catalog
- Public vs. private ratio
- Average rating
- Download-to-view ratio

**Community Health:**
- Likes per mode (average)
- Fork rate
- Comment activity
- Active contributors

**Technical Metrics:**
- API response time (p50, p95, p99)
- Error rate (< 0.1%)
- Uptime (99.9% target)
- Cache hit rate (> 80%)

---

### 12. Next Steps

#### Immediate Actions (This Week)

1. **Decision:** Approve architecture and tech stack
2. **Setup:** Create Supabase project and configure database
3. **Design:** Finalize API contracts and data models
4. **Planning:** Break down Phase 1 into detailed tasks
5. **Development:** Start with authentication implementation

#### Questions to Resolve

1. **Naming:** What should we call the cloud service? (e.g., "XL3 Cloud", "Mode Hub")
2. **Branding:** Visual identity for cloud features?
3. **Moderation:** Who will moderate content initially?
4. **Pricing:** Will there be a premium tier in the future?
5. **Legal:** Terms of service, privacy policy, DMCA process?

---

## Conclusion

This architecture provides a scalable, cost-effective foundation for cloud mode storage and sharing. The serverless approach with Supabase allows rapid development while maintaining professional-grade security and performance. The phased implementation ensures continuous delivery of value while managing complexity.

The system is designed to be:
- **User-friendly:** Seamless sync, offline-first, intuitive UI
- **Scalable:** From MVP to thousands of users without major rewrites
- **Secure:** Row-level security, content moderation, auth best practices
- **Cost-effective:** Free for development, affordable at scale
- **Maintainable:** Clean architecture, TypeScript safety, comprehensive testing

Ready to proceed with Phase 1 implementation.
