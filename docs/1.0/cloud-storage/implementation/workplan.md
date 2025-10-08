# Cloud Storage & Sharing Implementation Workplan

**Version:** 1.1
**Date:** 2025-10-08
**Status:** Implementation In Progress
**Prerequisites:** Authentication COMPLETE (Google OAuth via Supabase)

---

## Implementation Status

### Phase 1: Database Setup ✅ COMPLETE
- ✅ **Database schema design** - 4 SQL migration files created in `/Users/orion/work/xl3-web/supabase/migrations/`
  - `20241008000001_create_modes_table.sql`
  - `20241008000002_create_mode_engagement_tables.sql`
  - `20241008000003_create_categories_table.sql`
  - `20241008000004_create_rls_policies.sql`
- ⏳ **Run migrations in Supabase** - User needs to execute SQL in Supabase dashboard

### Phase 2: Service Layer ✅ COMPLETE
- ✅ **TypeScript types** - `/Users/orion/work/xl3-web/src/types/cloud-mode.ts` (619 lines, 37 exports)
- ✅ **CloudModeService** - `/Users/orion/work/xl3-web/src/services/cloud-mode-service.ts` (658 lines, 11 methods)
  - CRUD operations for modes
  - Engagement operations (like, rate, fork)
  - Search and filtering
  - Category management

### Phase 3: React Query Hooks ✅ COMPLETE
- ✅ **React Query hooks** - `/Users/orion/work/xl3-web/src/hooks/use-cloud-modes.ts` (590 lines, 13 hooks)
  - `usePublicModes`, `useModeById`, `useUserModes`
  - `useCreateMode`, `useUpdateMode`, `useDeleteMode`
  - `useLikeMode`, `useRateMode`, `useForkMode`
  - Optimistic updates for likes
  - Cache invalidation strategies

### Phase 4: UI Components ✅ COMPLETE
- ✅ **SaveModeDialog component** - `/Users/orion/work/xl3-web/src/components/cloud-storage/SaveModeDialog.tsx` (431 lines)
  - Form for mode metadata
  - Validation with Zod
  - Upload functionality
- ✅ **ModeCard component** - `/Users/orion/work/xl3-web/src/components/cloud-storage/ModeCard.tsx` (484 lines)
  - Displays mode information
  - Engagement metrics
  - Action buttons
- ✅ **CatalogFilters component** - `/Users/orion/work/xl3-web/src/components/cloud-storage/CatalogFilters.tsx` (467 lines)
  - Category filtering
  - Tag filtering
  - Sort options
  - Search functionality

### Phase 5: Page Integration ✅ PARTIALLY COMPLETE
- ✅ **Catalog page** - `/Users/orion/work/xl3-web/src/pages/Catalog.tsx` - integrated with real cloud modes
- ✅ **Editor page** - `/Users/orion/work/xl3-web/src/pages/Editor.tsx` - SaveModeDialog integrated
- ✅ **Library page** - `/Users/orion/work/xl3-web/src/pages/Library.tsx` - updated to show user modes
- ⏳ **Mode detail view page** - Not yet created (`/Users/orion/work/xl3-web/src/pages/ModeDetail.tsx`)

### Phase 6: Testing & Deployment ⏳ PENDING
- ⏳ **E2E testing** - Test suite not yet implemented
- ⏳ **Production deployment** - Migrations need to be run in production Supabase

---

## What Remains Before Production

### Critical Path (Required for MVP)
1. **Run Database Migrations** (User action required)
   - Navigate to Supabase dashboard
   - Execute SQL files in order:
     1. `20241008000001_create_modes_table.sql`
     2. `20241008000002_create_mode_engagement_tables.sql`
     3. `20241008000003_create_categories_table.sql`
     4. `20241008000004_create_rls_policies.sql`

2. **Create Mode Detail Page** (Development task)
   - File: `/Users/orion/work/xl3-web/src/pages/ModeDetail.tsx`
   - Show full mode information
   - Display engagement metrics
   - Implement like/rate/fork functionality
   - Add download button

3. **E2E Testing** (Quality assurance)
   - Browse public catalog
   - Create mode flow
   - Like/unlike mode
   - Fork mode
   - Delete mode

### Nice-to-Have (Post-MVP)
- Offline support with IndexedDB
- Real-time updates via Supabase subscriptions
- Mode version history UI
- Advanced search filters
- User profiles
- Comments and discussions

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Storage Design](#4-storage-design)
5. [API Design](#5-api-design)
6. [Security Model](#6-security-model)
7. [TypeScript Types](#7-typescript-types)
8. [Implementation Steps](#8-implementation-steps)
9. [Timeline Estimate](#9-timeline-estimate)
10. [Testing Strategy](#10-testing-strategy)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Appendices](#appendices)

---

## 1. Overview

### 1.1 Feature Summary

This feature enables users to:
- Save custom MIDI controller modes to the cloud
- Load their modes from any device (cross-device sync)
- Share modes publicly to a global catalog
- Browse and download community-created modes
- Fork and remix existing modes
- Engage with modes (likes, ratings, comments)

### 1.2 Technical Approach

**Backend:** Supabase (PostgreSQL + RLS + Storage)
**Frontend:** React + TanStack Query + existing AuthContext
**Deployment:** Netlify (frontend) + Supabase (backend)

### 1.3 Key Design Decisions

1. **Direct Supabase Integration:** No custom backend needed - use Supabase client directly with RLS policies
2. **Netlify Functions:** Only for complex operations (webhooks, analytics, external API calls)
3. **Mode Storage:** PostgreSQL JSONB for mode data (flexible, queryable)
4. **File Storage:** Supabase Storage for thumbnails/attachments (future)
5. **Search:** PostgreSQL full-text search + GIN indexes
6. **Real-time:** Supabase real-time subscriptions for live updates (future)

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (React SPA)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pages:  Catalog | Library | Editor | Mode Detail       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Hooks:  useCloudModes | useUserModes | useLikeMode     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Services:  CloudModeService | SyncManager              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Context:  AuthContext (existing)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (Supabase Client)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │  PostgreSQL   │  │  Supabase     │  │  Supabase     │      │
│  │  + RLS        │  │  Auth         │  │  Storage      │      │
│  │               │  │  (OAuth)      │  │  (future)     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│  Tables: modes, mode_likes, mode_ratings, mode_versions        │
│  RLS: User ownership + Public catalog policies                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Optional - future)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Netlify Functions (optional)                  │
│  - Analytics processing                                          │
│  - Webhook handlers                                              │
│  - Complex data transformations                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### Create/Update Mode

```
User Editor → CloudModeService.uploadMode()
           → Supabase client (direct)
           → PostgreSQL INSERT/UPDATE
           → RLS policy validates auth.uid() = author_id
           → Return CloudMode
           → React Query cache update
           → UI refresh
```

#### Browse Public Catalog

```
User Catalog → usePublicModes()
            → CloudModeService.browseModes({ isPublic: true })
            → Supabase client (direct query)
            → PostgreSQL SELECT with RLS (public modes only)
            → Return CloudMode[]
            → React Query cache
            → Render mode cards
```

#### Like/Rate Mode

```
User clicks Like → useLikeMode.mutate(modeId)
                 → CloudModeService.likeMode(modeId)
                 → Supabase INSERT into mode_likes
                 → Supabase UPDATE modes.likes += 1
                 → RLS validates user authenticated
                 → Optimistic UI update
                 → Background sync
```

### 2.3 Offline/Sync Strategy

**Phase 1 (MVP):** Online-only
- All operations require internet connection
- Show loading states and error messages
- Local state via React Query cache (5-minute stale time)

**Phase 2 (Future):** Offline-first with sync
- Local IndexedDB storage for modes
- Queue operations when offline
- Sync on reconnect with conflict resolution
- Background sync service worker

---

## 3. Database Schema

### 3.1 PostgreSQL Tables

```sql
-- Users table (already exists from auth)
-- Extended via Supabase Auth + user_metadata

-- Modes table (core storage)
CREATE TABLE modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Mode metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',

  -- Mode data (JSONB for flexibility)
  controls JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Visibility
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  -- Engagement metrics (denormalized for performance)
  downloads INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  fork_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0,

  -- Discovery
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  thumbnail TEXT, -- Base64 or URL (future: Supabase Storage)

  -- Relationships
  parent_mode_id UUID REFERENCES modes(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+$')
);

-- Indexes for performance
CREATE INDEX idx_modes_author ON modes(author_id);
CREATE INDEX idx_modes_public ON modes(is_public) WHERE is_public = true;
CREATE INDEX idx_modes_featured ON modes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_modes_category ON modes(category);
CREATE INDEX idx_modes_tags ON modes USING GIN(tags);
CREATE INDEX idx_modes_created ON modes(created_at DESC);
CREATE INDEX idx_modes_downloads ON modes(downloads DESC);
CREATE INDEX idx_modes_likes ON modes(likes DESC);
CREATE INDEX idx_modes_rating ON modes(rating DESC);

-- Full-text search index
CREATE INDEX idx_modes_search ON modes USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Mode likes (many-to-many)
CREATE TABLE mode_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mode_id)
);

CREATE INDEX idx_mode_likes_mode ON mode_likes(mode_id);
CREATE INDEX idx_mode_likes_user ON mode_likes(user_id);

-- Mode ratings (one per user per mode)
CREATE TABLE mode_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mode_id)
);

CREATE INDEX idx_mode_ratings_mode ON mode_ratings(mode_id);

-- Mode versions (version history)
CREATE TABLE mode_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id UUID NOT NULL REFERENCES modes(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  changes TEXT,
  controls JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(mode_id, version)
);

CREATE INDEX idx_mode_versions_mode ON mode_versions(mode_id, created_at DESC);

-- Categories (predefined)
CREATE TABLE categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,

  UNIQUE(name)
);

-- Insert default categories
INSERT INTO categories (id, name, description, display_order) VALUES
  ('daw-control', 'DAW Control', 'Digital Audio Workstation control surfaces', 1),
  ('live-performance', 'Live Performance', 'Setups for live shows and DJing', 2),
  ('mixing-mastering', 'Mixing & Mastering', 'Studio mixing and mastering workflows', 3),
  ('instrument-control', 'Instrument Control', 'Hardware synth and instrument mappings', 4),
  ('genre-specific', 'Genre-Specific', 'Genre-optimized configurations', 5),
  ('educational', 'Educational', 'Learning and tutorial modes', 6);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modes_modified_at
  BEFORE UPDATE ON modes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER mode_ratings_updated_at
  BEFORE UPDATE ON mode_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();

-- Function to update mode rating aggregate
CREATE OR REPLACE FUNCTION update_mode_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE modes
  SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM mode_ratings WHERE mode_id = NEW.mode_id),
    rating_count = (SELECT COUNT(*) FROM mode_ratings WHERE mode_id = NEW.mode_id)
  WHERE id = NEW.mode_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mode_ratings_update_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON mode_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mode_rating();
```

### 3.2 Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mode_versions ENABLE ROW LEVEL SECURITY;

-- Modes policies
-- Anyone can view public modes
CREATE POLICY "Public modes are viewable by everyone"
  ON modes FOR SELECT
  USING (is_public = true);

-- Users can view their own modes (public or private)
CREATE POLICY "Users can view own modes"
  ON modes FOR SELECT
  USING (auth.uid() = author_id);

-- Users can create modes (author_id must match auth.uid())
CREATE POLICY "Users can create modes"
  ON modes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own modes
CREATE POLICY "Users can update own modes"
  ON modes FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own modes
CREATE POLICY "Users can delete own modes"
  ON modes FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can do everything (optional - requires custom JWT claims)
CREATE POLICY "Admins have full access to modes"
  ON modes
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
  );

-- Mode likes policies
-- Anyone can view likes on public modes
CREATE POLICY "Public mode likes are viewable"
  ON mode_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_likes.mode_id
      AND modes.is_public = true
    )
  );

-- Users can view their own likes
CREATE POLICY "Users can view own likes"
  ON mode_likes FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can like modes
CREATE POLICY "Authenticated users can like modes"
  ON mode_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_likes.mode_id
      AND modes.is_public = true
    )
  );

-- Users can unlike modes they liked
CREATE POLICY "Users can unlike modes"
  ON mode_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Mode ratings policies
-- Anyone can view ratings on public modes
CREATE POLICY "Public mode ratings are viewable"
  ON mode_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_ratings.mode_id
      AND modes.is_public = true
    )
  );

-- Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON mode_ratings FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can rate modes
CREATE POLICY "Authenticated users can rate modes"
  ON mode_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_ratings.mode_id
      AND modes.is_public = true
    )
  );

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON mode_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON mode_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Mode versions policies
-- Users can view versions of modes they can access
CREATE POLICY "Users can view accessible mode versions"
  ON mode_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_versions.mode_id
      AND (modes.is_public = true OR modes.author_id = auth.uid())
    )
  );

-- Only mode authors can create versions
CREATE POLICY "Authors can create mode versions"
  ON mode_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modes
      WHERE modes.id = mode_versions.mode_id
      AND modes.author_id = auth.uid()
    )
  );

-- Categories are public (read-only)
-- No RLS needed - all users can read, only admins can modify via Supabase dashboard
```

---

## 4. Storage Design

### 4.1 Mode Data Storage

**Primary Storage:** PostgreSQL JSONB column
- Flexible schema for mode controls
- Queryable with PostgreSQL JSON operators
- Versioned via `mode_versions` table
- No size limit concerns (typical mode < 50KB)

**Example JSONB structure:**
```json
{
  "control_1": {
    "id": "control_1",
    "type": "knob",
    "ccNumber": 21,
    "midiChannel": 1,
    "minValue": 0,
    "maxValue": 127,
    "label": "Volume"
  },
  "control_2": {
    "id": "control_2",
    "type": "fader",
    "ccNumber": 22,
    "midiChannel": 1,
    "minValue": 0,
    "maxValue": 127,
    "label": "Pan"
  }
}
```

### 4.2 File Storage (Future - Phase 2)

**Supabase Storage Buckets:**
- `mode-thumbnails`: Mode preview images (1MB limit per file)
- `mode-attachments`: Documentation, PDFs, etc. (10MB limit per file)

**Storage Policies:**
```sql
-- Public read access to thumbnails of public modes
CREATE POLICY "Public mode thumbnails are accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mode-thumbnails' AND storage.foldername(name)[1] IN (
    SELECT id::text FROM modes WHERE is_public = true
  ));

-- Users can upload their own mode thumbnails
CREATE POLICY "Users can upload mode thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mode-thumbnails'
    AND auth.uid()::text = storage.foldername(name)[1]
  );
```

### 4.3 Caching Strategy

**React Query Cache:**
- Public modes: 5 minute stale time
- User modes: 1 minute stale time
- Mode details: 5 minute stale time
- Categories: 1 hour stale time (rarely change)

**Database Query Cache:**
- PostgreSQL query planner handles caching automatically
- Materialized views for expensive aggregations (future)

---

## 5. API Design

### 5.1 Supabase Client Queries

All operations use Supabase client directly - no custom REST API needed.

```typescript
// Browse public modes with filters
const { data, error } = await supabase
  .from('modes')
  .select(`
    *,
    author:author_id (
      id,
      email,
      user_metadata
    ),
    user_liked:mode_likes!left (
      user_id
    )
  `)
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .limit(20);

// Get user's modes
const { data, error } = await supabase
  .from('modes')
  .select('*')
  .eq('author_id', userId);

// Create mode
const { data, error } = await supabase
  .from('modes')
  .insert({
    author_id: userId,
    name: 'My Mode',
    description: 'Description',
    version: '1.0.0',
    controls: { /* controls data */ },
    is_public: false
  })
  .select()
  .single();

// Update mode
const { data, error } = await supabase
  .from('modes')
  .update({
    name: 'Updated Name',
    description: 'Updated Description',
    controls: { /* updated controls */ }
  })
  .eq('id', modeId)
  .select()
  .single();

// Delete mode
const { error } = await supabase
  .from('modes')
  .delete()
  .eq('id', modeId);

// Like mode
const { error } = await supabase
  .from('mode_likes')
  .insert({ user_id: userId, mode_id: modeId });

// Unlike mode
const { error } = await supabase
  .from('mode_likes')
  .delete()
  .match({ user_id: userId, mode_id: modeId });

// Rate mode
const { error } = await supabase
  .from('mode_ratings')
  .upsert({
    user_id: userId,
    mode_id: modeId,
    rating: 5,
    review: 'Great mode!'
  });

// Search modes
const { data, error } = await supabase
  .from('modes')
  .select('*')
  .textSearch('fts', searchQuery, {
    type: 'websearch',
    config: 'english'
  })
  .eq('is_public', true);

// Fork mode
const { data: originalMode, error: fetchError } = await supabase
  .from('modes')
  .select('*')
  .eq('id', modeId)
  .single();

if (fetchError) throw fetchError;

const { data: forkedMode, error: insertError } = await supabase
  .from('modes')
  .insert({
    author_id: userId,
    name: `${originalMode.name} (Fork)`,
    description: originalMode.description,
    version: '1.0.0',
    controls: originalMode.controls,
    parent_mode_id: originalMode.id,
    is_public: false
  })
  .select()
  .single();
```

### 5.2 Netlify Functions (Optional - Future)

Only needed for complex operations that can't be done client-side.

**Example: Analytics Webhook**
```typescript
// netlify/functions/mode-analytics.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
  );

  // Track mode download with analytics service
  const { modeId } = JSON.parse(event.body || '{}');

  // Increment download count
  await supabase
    .from('modes')
    .update({ downloads: supabase.sql`downloads + 1` })
    .eq('id', modeId);

  // Send to external analytics (e.g., PostHog)
  await fetch('https://analytics.example.com/track', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.ANALYTICS_KEY}` },
    body: JSON.stringify({ event: 'mode_download', modeId })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

---

## 6. Security Model

### 6.1 Authentication

**Already Implemented:**
- Google OAuth via Supabase Auth
- JWT tokens with automatic refresh
- Session persistence across devices

**No Changes Needed:**
- AuthContext provides user session
- All database queries automatically include JWT token
- RLS policies use `auth.uid()` to validate ownership

### 6.2 Authorization

**Row-Level Security (RLS) Enforces:**
- Users can only view/edit/delete their own private modes
- Anyone can view public modes
- Only authenticated users can create modes
- Only authenticated users can like/rate modes
- Users cannot like/rate their own modes (future enhancement)

### 6.3 Input Validation

**Client-Side Validation:**
```typescript
import { z } from 'zod';

const ControlMappingSchema = z.object({
  id: z.string(),
  type: z.enum(['knob', 'fader', 'button']),
  ccNumber: z.number().int().min(0).max(127),
  midiChannel: z.number().int().min(1).max(16),
  minValue: z.number().int().min(0).max(127),
  maxValue: z.number().int().min(0).max(127),
  label: z.string().max(50).optional(),
});

const CloudModeSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  description: z.string().max(1000, 'Description too long'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version (use semver)'),
  controls: z.record(z.string(), ControlMappingSchema),
  tags: z.array(z.string().max(30)).max(10),
  category: z.string().max(100).optional(),
  isPublic: z.boolean(),
});
```

**Database Validation:**
- PostgreSQL constraints (CHECK, UNIQUE, NOT NULL)
- Version format validation: `^\d+\.\d+\.\d+$`
- Rating range: 1-5
- Tag array size limit

### 6.4 Rate Limiting

**Supabase Built-in Rate Limiting:**
- Anonymous: 200 requests/hour
- Authenticated: 10,000 requests/hour
- Adjustable via Supabase dashboard

**Future: Custom Rate Limiting**
```typescript
// Netlify Function with rate limiting
import rateLimit from 'lambda-rate-limiter';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export const handler: Handler = async (event) => {
  try {
    await limiter.check(10, event.headers['x-forwarded-for']); // 10 requests per minute
  } catch {
    return { statusCode: 429, body: 'Rate limit exceeded' };
  }

  // Handle request
};
```

---

## 7. TypeScript Types

### 7.1 Core Types

```typescript
// src/types/cloud-mode.ts

import { CustomMode } from '@/types/mode';

export interface CloudMode extends CustomMode {
  // Unique identification
  id: string;

  // Ownership
  authorId: string;
  author?: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };

  // Visibility
  isPublic: boolean;
  isOfficial: boolean;
  isFeatured: boolean;

  // Engagement (denormalized)
  downloads: number;
  likes: number;
  views: number;
  rating: number;
  ratingCount: number;
  forkCount: number;

  // Discovery
  tags: string[];
  category?: string;
  thumbnail?: string;

  // Relationships
  parentModeId?: string;
  parentMode?: CloudMode;

  // Timestamps
  publishedAt?: string;
  updatedAt: string;

  // Client-side computed
  userLiked?: boolean;
  userRating?: number;
}

export interface ModeVersion {
  id: string;
  modeId: string;
  version: string;
  changes: string;
  controls: Record<string, ControlMapping>;
  createdAt: string;
}

export interface ModeMetadata {
  name: string;
  description: string;
  tags: string[];
  category?: string;
  isPublic: boolean;
  thumbnail?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  displayOrder: number;
}

export interface ModeFilters {
  category?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  sort?: 'recent' | 'downloads' | 'likes' | 'rating';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ModeEngagement {
  liked: boolean;
  likesCount: number;
  userRating?: number;
  averageRating: number;
  ratingCount: number;
}
```

### 7.2 Supabase Types

```typescript
// src/types/supabase-database.ts
// Generated via: supabase gen types typescript --project-id YOUR_PROJECT_ID

export interface Database {
  public: {
    Tables: {
      modes: {
        Row: {
          id: string;
          author_id: string;
          name: string;
          description: string | null;
          version: string;
          controls: Record<string, any>;
          is_public: boolean;
          is_official: boolean;
          is_featured: boolean;
          downloads: number;
          likes: number;
          views: number;
          fork_count: number;
          rating: number | null;
          rating_count: number;
          tags: string[];
          category: string | null;
          thumbnail: string | null;
          parent_mode_id: string | null;
          created_at: string;
          modified_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          name: string;
          description?: string | null;
          version?: string;
          controls: Record<string, any>;
          is_public?: boolean;
          is_official?: boolean;
          is_featured?: boolean;
          downloads?: number;
          likes?: number;
          views?: number;
          fork_count?: number;
          rating?: number | null;
          rating_count?: number;
          tags?: string[];
          category?: string | null;
          thumbnail?: string | null;
          parent_mode_id?: string | null;
          created_at?: string;
          modified_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          name?: string;
          description?: string | null;
          version?: string;
          controls?: Record<string, any>;
          is_public?: boolean;
          is_official?: boolean;
          is_featured?: boolean;
          downloads?: number;
          likes?: number;
          views?: number;
          fork_count?: number;
          rating?: number | null;
          rating_count?: number;
          tags?: string[];
          category?: string | null;
          thumbnail?: string | null;
          parent_mode_id?: string | null;
          created_at?: string;
          modified_at?: string;
          published_at?: string | null;
        };
      };
      mode_likes: {
        Row: {
          user_id: string;
          mode_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mode_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          mode_id?: string;
          created_at?: string;
        };
      };
      mode_ratings: {
        Row: {
          user_id: string;
          mode_id: string;
          rating: number;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          mode_id: string;
          rating: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          mode_id?: string;
          rating?: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mode_versions: {
        Row: {
          id: string;
          mode_id: string;
          version: string;
          changes: string | null;
          controls: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          mode_id: string;
          version: string;
          changes?: string | null;
          controls: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          mode_id?: string;
          version?: string;
          changes?: string | null;
          controls?: Record<string, any>;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          display_order: number;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          display_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          display_order?: number;
        };
      };
    };
  };
}
```

---

## 8. Implementation Steps

### Phase 1: Database Setup (4-6 hours)

#### 8.1 Create Database Schema
- **File:** `supabase/migrations/001_modes_schema.sql`
- Create modes table with indexes
- Create mode_likes, mode_ratings tables
- Create mode_versions table
- Create categories table with seed data
- Add triggers for updated_at and rating aggregation

**Verification:**
```bash
# After running migration
ls -la supabase/migrations/001_modes_schema.sql
head -20 supabase/migrations/001_modes_schema.sql
```

#### 8.2 Configure RLS Policies
- **File:** `supabase/migrations/002_rls_policies.sql`
- Enable RLS on all tables
- Create policies for modes (view, create, update, delete)
- Create policies for likes and ratings
- Create policies for version history

**Verification:**
```bash
ls -la supabase/migrations/002_rls_policies.sql
wc -l supabase/migrations/002_rls_policies.sql
```

#### 8.3 Generate TypeScript Types
- **Command:** `supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase-database.ts`
- Verify types compile with existing code

**Verification:**
```bash
ls -la src/types/supabase-database.ts
head -30 src/types/supabase-database.ts
pnpm tsc --noEmit
```

---

### Phase 2: Service Layer (6-8 hours)

#### 8.4 Create CloudModeService
- **File:** `src/lib/services/cloud-mode-service.ts`
- Implement CRUD operations using Supabase client
- Implement search and filtering
- Implement engagement operations (like, rate, fork)
- Error handling and type safety

**Implementation:**
```typescript
// src/lib/services/cloud-mode-service.ts

import { supabase } from '@/lib/supabase';
import { CloudMode, ModeFilters, ModeMetadata, PaginatedResponse } from '@/types/cloud-mode';
import { CustomMode } from '@/types/mode';
import { Database } from '@/types/supabase-database';

type ModeRow = Database['public']['Tables']['modes']['Row'];
type ModeInsert = Database['public']['Tables']['modes']['Insert'];
type ModeUpdate = Database['public']['Tables']['modes']['Update'];

export class CloudModeService {
  /**
   * Convert database row to CloudMode
   */
  private toCloudMode(row: ModeRow, userId?: string): CloudMode {
    return {
      id: row.id,
      authorId: row.author_id,
      name: row.name,
      description: row.description || '',
      version: row.version,
      controls: row.controls as Record<string, any>,
      isPublic: row.is_public,
      isOfficial: row.is_official,
      isFeatured: row.is_featured,
      downloads: row.downloads,
      likes: row.likes,
      views: row.views,
      rating: row.rating || 0,
      ratingCount: row.rating_count,
      forkCount: row.fork_count,
      tags: row.tags,
      category: row.category || undefined,
      thumbnail: row.thumbnail || undefined,
      parentModeId: row.parent_mode_id || undefined,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      publishedAt: row.published_at || undefined,
      updatedAt: row.modified_at,
    };
  }

  /**
   * Browse public modes with filters
   */
  async browseModes(filters: ModeFilters = {}): Promise<PaginatedResponse<CloudMode>> {
    const {
      category,
      tags,
      isPublic = true,
      isFeatured,
      sort = 'recent',
      search,
      page = 1,
      limit = 20,
    } = filters;

    let query = supabase
      .from('modes')
      .select('*', { count: 'exact' })
      .eq('is_public', isPublic);

    if (category) {
      query = query.eq('category', category);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }

    if (search) {
      query = query.textSearch('fts', search, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Sorting
    switch (sort) {
      case 'downloads':
        query = query.order('downloads', { ascending: false });
        break;
      case 'likes':
        query = query.order('likes', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsLast: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch modes: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []).map(row => this.toCloudMode(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get mode by ID
   */
  async getModeById(id: string, userId?: string): Promise<CloudMode> {
    const { data, error } = await supabase
      .from('modes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch mode: ${error.message}`);
    }

    return this.toCloudMode(data, userId);
  }

  /**
   * Get user's modes
   */
  async getUserModes(userId: string): Promise<CloudMode[]> {
    const { data, error } = await supabase
      .from('modes')
      .select('*')
      .eq('author_id', userId)
      .order('modified_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user modes: ${error.message}`);
    }

    return (data || []).map(row => this.toCloudMode(row, userId));
  }

  /**
   * Create new mode
   */
  async createMode(userId: string, mode: CustomMode, metadata: ModeMetadata): Promise<CloudMode> {
    const insert: ModeInsert = {
      author_id: userId,
      name: metadata.name,
      description: metadata.description,
      version: mode.version,
      controls: mode.controls as any,
      is_public: metadata.isPublic,
      tags: metadata.tags,
      category: metadata.category,
      thumbnail: metadata.thumbnail,
    };

    const { data, error } = await supabase
      .from('modes')
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create mode: ${error.message}`);
    }

    return this.toCloudMode(data, userId);
  }

  /**
   * Update existing mode
   */
  async updateMode(modeId: string, updates: Partial<CloudMode>): Promise<CloudMode> {
    const update: ModeUpdate = {};

    if (updates.name !== undefined) update.name = updates.name;
    if (updates.description !== undefined) update.description = updates.description;
    if (updates.version !== undefined) update.version = updates.version;
    if (updates.controls !== undefined) update.controls = updates.controls as any;
    if (updates.isPublic !== undefined) update.is_public = updates.isPublic;
    if (updates.tags !== undefined) update.tags = updates.tags;
    if (updates.category !== undefined) update.category = updates.category;
    if (updates.thumbnail !== undefined) update.thumbnail = updates.thumbnail;

    const { data, error } = await supabase
      .from('modes')
      .update(update)
      .eq('id', modeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update mode: ${error.message}`);
    }

    return this.toCloudMode(data);
  }

  /**
   * Delete mode
   */
  async deleteMode(modeId: string): Promise<void> {
    const { error } = await supabase
      .from('modes')
      .delete()
      .eq('id', modeId);

    if (error) {
      throw new Error(`Failed to delete mode: ${error.message}`);
    }
  }

  /**
   * Like mode
   */
  async likeMode(userId: string, modeId: string): Promise<{ liked: boolean; likesCount: number }> {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('mode_likes')
      .select('*')
      .match({ user_id: userId, mode_id: modeId })
      .single();

    if (existingLike) {
      // Unlike
      const { error: unlikeError } = await supabase
        .from('mode_likes')
        .delete()
        .match({ user_id: userId, mode_id: modeId });

      if (unlikeError) {
        throw new Error(`Failed to unlike mode: ${unlikeError.message}`);
      }

      // Decrement likes count
      const { error: updateError } = await supabase.rpc('decrement_likes', { mode_id: modeId });

      if (updateError) {
        throw new Error(`Failed to update likes count: ${updateError.message}`);
      }

      const { data: mode } = await supabase
        .from('modes')
        .select('likes')
        .eq('id', modeId)
        .single();

      return { liked: false, likesCount: mode?.likes || 0 };
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('mode_likes')
        .insert({ user_id: userId, mode_id: modeId });

      if (likeError) {
        throw new Error(`Failed to like mode: ${likeError.message}`);
      }

      // Increment likes count
      const { error: updateError } = await supabase.rpc('increment_likes', { mode_id: modeId });

      if (updateError) {
        throw new Error(`Failed to update likes count: ${updateError.message}`);
      }

      const { data: mode } = await supabase
        .from('modes')
        .select('likes')
        .eq('id', modeId)
        .single();

      return { liked: true, likesCount: mode?.likes || 0 };
    }
  }

  /**
   * Rate mode
   */
  async rateMode(
    userId: string,
    modeId: string,
    rating: number,
    review?: string
  ): Promise<{ averageRating: number; ratingCount: number }> {
    const { error } = await supabase
      .from('mode_ratings')
      .upsert({
        user_id: userId,
        mode_id: modeId,
        rating,
        review,
      });

    if (error) {
      throw new Error(`Failed to rate mode: ${error.message}`);
    }

    // Rating aggregate is updated by database trigger
    const { data: mode } = await supabase
      .from('modes')
      .select('rating, rating_count')
      .eq('id', modeId)
      .single();

    return {
      averageRating: mode?.rating || 0,
      ratingCount: mode?.rating_count || 0,
    };
  }

  /**
   * Fork mode
   */
  async forkMode(
    userId: string,
    modeId: string,
    overrides?: { name?: string; description?: string }
  ): Promise<CloudMode> {
    // Get original mode
    const { data: originalMode, error: fetchError } = await supabase
      .from('modes')
      .select('*')
      .eq('id', modeId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch original mode: ${fetchError.message}`);
    }

    // Create fork
    const insert: ModeInsert = {
      author_id: userId,
      name: overrides?.name || `${originalMode.name} (Fork)`,
      description: overrides?.description || originalMode.description,
      version: '1.0.0',
      controls: originalMode.controls,
      is_public: false,
      tags: originalMode.tags,
      category: originalMode.category,
      parent_mode_id: originalMode.id,
    };

    const { data: forkedMode, error: insertError } = await supabase
      .from('modes')
      .insert(insert)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to fork mode: ${insertError.message}`);
    }

    // Increment fork count on original
    await supabase.rpc('increment_fork_count', { mode_id: modeId });

    return this.toCloudMode(forkedMode, userId);
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }
}

export const cloudModeService = new CloudModeService();
```

**Verification:**
```bash
ls -la src/lib/services/cloud-mode-service.ts
wc -l src/lib/services/cloud-mode-service.ts
head -50 src/lib/services/cloud-mode-service.ts
```

#### 8.5 Create Database Functions (RPC)
- **File:** `supabase/migrations/003_rpc_functions.sql`
- Create functions for atomic operations (increment likes, decrement likes, increment fork count)

**Implementation:**
```sql
-- Function to increment likes atomically
CREATE OR REPLACE FUNCTION increment_likes(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET likes = likes + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes atomically
CREATE OR REPLACE FUNCTION decrement_likes(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment fork count atomically
CREATE OR REPLACE FUNCTION increment_fork_count(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET fork_count = fork_count + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION increment_views(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET views = views + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment downloads atomically
CREATE OR REPLACE FUNCTION increment_downloads(mode_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE modes
  SET downloads = downloads + 1
  WHERE id = mode_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Verification:**
```bash
ls -la supabase/migrations/003_rpc_functions.sql
cat supabase/migrations/003_rpc_functions.sql
```

---

### Phase 3: React Query Hooks (4-6 hours)

#### 8.6 Create React Query Hooks
- **File:** `src/hooks/useCloudModes.ts`
- Implement hooks for all cloud operations
- Optimistic updates for likes
- Cache invalidation strategy
- Error handling

**Implementation:**
```typescript
// src/hooks/useCloudModes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { cloudModeService } from '@/lib/services/cloud-mode-service';
import {
  CloudMode,
  ModeFilters,
  ModeMetadata,
  PaginatedResponse,
} from '@/types/cloud-mode';
import { CustomMode } from '@/types/mode';

// Query keys
export const cloudModeKeys = {
  all: ['cloud-modes'] as const,
  lists: () => [...cloudModeKeys.all, 'list'] as const,
  list: (filters: ModeFilters) => [...cloudModeKeys.lists(), filters] as const,
  details: () => [...cloudModeKeys.all, 'detail'] as const,
  detail: (id: string) => [...cloudModeKeys.details(), id] as const,
  userModes: (userId: string) => [...cloudModeKeys.all, 'user', userId] as const,
  categories: () => [...cloudModeKeys.all, 'categories'] as const,
};

/**
 * Browse public modes with filters
 */
export function usePublicModes(filters: ModeFilters = {}) {
  return useQuery({
    queryKey: cloudModeKeys.list({ ...filters, isPublic: true }),
    queryFn: () => cloudModeService.browseModes({ ...filters, isPublic: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get mode by ID
 */
export function useModeById(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: cloudModeKeys.detail(id),
    queryFn: () => cloudModeService.getModeById(id, user?.id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get user's modes (requires authentication)
 */
export function useUserModes() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: cloudModeKeys.userModes(user?.id || ''),
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return cloudModeService.getUserModes(user.id);
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create new mode
 */
export function useCreateMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { mode: CustomMode; metadata: ModeMetadata }) => {
      if (!user) throw new Error('User not authenticated');
      return cloudModeService.createMode(user.id, data.mode, data.metadata);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: cloudModeKeys.userModes(user.id) });
      }
    },
  });
}

/**
 * Update mode
 */
export function useUpdateMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { modeId: string; updates: Partial<CloudMode> }) =>
      cloudModeService.updateMode(data.modeId, data.updates),
    onSuccess: (updatedMode) => {
      queryClient.setQueryData(cloudModeKeys.detail(updatedMode.id), updatedMode);
      if (user) {
        queryClient.invalidateQueries({ queryKey: cloudModeKeys.userModes(user.id) });
      }
    },
  });
}

/**
 * Delete mode
 */
export function useDeleteMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (modeId: string) => cloudModeService.deleteMode(modeId),
    onSuccess: (_, modeId) => {
      queryClient.removeQueries({ queryKey: cloudModeKeys.detail(modeId) });
      if (user) {
        queryClient.invalidateQueries({ queryKey: cloudModeKeys.userModes(user.id) });
      }
    },
  });
}

/**
 * Like/unlike mode (with optimistic update)
 */
export function useLikeMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (modeId: string) => {
      if (!user) throw new Error('User not authenticated');
      return cloudModeService.likeMode(user.id, modeId);
    },
    onMutate: async (modeId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cloudModeKeys.detail(modeId) });

      // Snapshot previous value
      const previousMode = queryClient.getQueryData<CloudMode>(cloudModeKeys.detail(modeId));

      // Optimistically update
      if (previousMode) {
        const optimisticMode: CloudMode = {
          ...previousMode,
          likes: previousMode.userLiked ? previousMode.likes - 1 : previousMode.likes + 1,
          userLiked: !previousMode.userLiked,
        };
        queryClient.setQueryData(cloudModeKeys.detail(modeId), optimisticMode);
      }

      return { previousMode };
    },
    onError: (err, modeId, context) => {
      // Rollback on error
      if (context?.previousMode) {
        queryClient.setQueryData(cloudModeKeys.detail(modeId), context.previousMode);
      }
    },
    onSettled: (data, error, modeId) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.detail(modeId) });
    },
  });
}

/**
 * Rate mode
 */
export function useRateMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { modeId: string; rating: number; review?: string }) => {
      if (!user) throw new Error('User not authenticated');
      return cloudModeService.rateMode(user.id, data.modeId, data.rating, data.review);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.detail(variables.modeId) });
    },
  });
}

/**
 * Fork mode
 */
export function useForkMode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: {
      modeId: string;
      overrides?: { name?: string; description?: string };
    }) => {
      if (!user) throw new Error('User not authenticated');
      return cloudModeService.forkMode(user.id, data.modeId, data.overrides);
    },
    onSuccess: (forkedMode) => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: cloudModeKeys.userModes(user.id) });
      }
      // Invalidate original mode to update fork count
      if (forkedMode.parentModeId) {
        queryClient.invalidateQueries({
          queryKey: cloudModeKeys.detail(forkedMode.parentModeId),
        });
      }
    },
  });
}

/**
 * Get categories
 */
export function useCategories() {
  return useQuery({
    queryKey: cloudModeKeys.categories(),
    queryFn: () => cloudModeService.getCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
```

**Verification:**
```bash
ls -la src/hooks/useCloudModes.ts
wc -l src/hooks/useCloudModes.ts
head -50 src/hooks/useCloudModes.ts
```

---

### Phase 4: UI Components (8-10 hours)

#### 8.7 Update Catalog Page
- **File:** `src/pages/Catalog.tsx`
- Replace mock data with real cloud modes
- Implement filters (category, tags, sort)
- Implement search
- Pagination
- Loading states

**Verification:**
```bash
ls -la src/pages/Catalog.tsx
wc -l src/pages/Catalog.tsx
```

#### 8.8 Update Library Page
- **File:** `src/pages/Library.tsx`
- Show user's modes from cloud
- Add upload button
- Edit/delete actions
- Publish/unpublish toggle

**Verification:**
```bash
ls -la src/pages/Library.tsx
wc -l src/pages/Library.tsx
```

#### 8.9 Create Mode Detail Page
- **File:** `src/pages/ModeDetail.tsx`
- Show full mode details
- Like button
- Rating component
- Fork button
- Download button
- Comments section (future)

**Verification:**
```bash
ls -la src/pages/ModeDetail.tsx
wc -l src/pages/ModeDetail.tsx
```

#### 8.10 Create Mode Card Component
- **File:** `src/components/mode/ModeCard.tsx`
- Reusable card for catalog and library
- Show thumbnail, name, author, engagement metrics
- Hover effects
- Action buttons

**Verification:**
```bash
ls -la src/components/mode/ModeCard.tsx
wc -l src/components/mode/ModeCard.tsx
```

#### 8.11 Create Mode Upload Dialog
- **File:** `src/components/mode/ModeUploadDialog.tsx`
- Form for mode metadata (name, description, tags, category)
- Validation with Zod
- Upload progress
- Error handling

**Verification:**
```bash
ls -la src/components/mode/ModeUploadDialog.tsx
wc -l src/components/mode/ModeUploadDialog.tsx
```

---

### Phase 5: Integration & Testing (6-8 hours)

#### 8.12 Update Router
- **File:** `src/App.tsx`
- Add route for mode detail page: `/modes/:id`
- Ensure routes are protected appropriately

**Verification:**
```bash
ls -la src/App.tsx
grep -n "modes/" src/App.tsx
```

#### 8.13 E2E Tests
- **File:** `tests/e2e/cloud-modes.spec.ts`
- Test browsing public catalog
- Test creating mode
- Test liking mode
- Test forking mode
- Test deleting mode

**Verification:**
```bash
ls -la tests/e2e/cloud-modes.spec.ts
wc -l tests/e2e/cloud-modes.spec.ts
```

#### 8.14 Unit Tests
- **File:** `src/lib/services/__tests__/cloud-mode-service.test.ts`
- Test all CloudModeService methods
- Mock Supabase client
- Test error handling

**Verification:**
```bash
ls -la src/lib/services/__tests__/cloud-mode-service.test.ts
wc -l src/lib/services/__tests__/cloud-mode-service.test.ts
```

---

## 9. Timeline Estimate

### Total: 28-38 hours

**Phase 1: Database Setup (4-6 hours)**
- Create schema: 2-3h
- Configure RLS policies: 1-2h
- Generate TypeScript types: 0.5h
- Create RPC functions: 0.5-1h

**Phase 2: Service Layer (6-8 hours)**
- CloudModeService implementation: 4-5h
- Error handling and types: 1-2h
- Testing service layer: 1h

**Phase 3: React Query Hooks (4-6 hours)**
- Implement all hooks: 3-4h
- Optimistic updates: 1h
- Error handling: 0.5-1h

**Phase 4: UI Components (8-10 hours)**
- Update Catalog page: 2h
- Update Library page: 2h
- Mode detail page: 2-3h
- Mode card component: 1h
- Upload dialog: 1-2h

**Phase 5: Integration & Testing (6-8 hours)**
- Router updates: 0.5h
- E2E tests: 3-4h
- Unit tests: 2-3h
- Bug fixes and polish: 0.5-1h

### Weekly Breakdown

**Week 1: Backend (10-14 hours)**
- Day 1-2: Database schema and RLS (4-6h)
- Day 3-4: Service layer (6-8h)

**Week 2: Frontend (12-16 hours)**
- Day 5-6: React Query hooks (4-6h)
- Day 7-9: UI components (8-10h)

**Week 3: Testing & Polish (6-8 hours)**
- Day 10-11: Integration and E2E tests (4-5h)
- Day 12: Unit tests and bug fixes (2-3h)

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// src/lib/services/__tests__/cloud-mode-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudModeService } from '@/lib/services/cloud-mode-service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('CloudModeService', () => {
  let service: CloudModeService;

  beforeEach(() => {
    service = new CloudModeService();
    vi.clearAllMocks();
  });

  describe('browseModes', () => {
    it('should fetch public modes with default filters', async () => {
      const mockData = [
        {
          id: '1',
          author_id: 'user1',
          name: 'Test Mode',
          description: 'Test',
          version: '1.0.0',
          controls: {},
          is_public: true,
          // ... other fields
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 }),
      } as any);

      const result = await service.browseModes();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Mode');
    });

    it('should filter by category', async () => {
      // Test implementation
    });

    it('should handle errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: 0 }),
      } as any);

      await expect(service.browseModes()).rejects.toThrow('Failed to fetch modes');
    });
  });

  describe('createMode', () => {
    it('should create mode with correct data', async () => {
      // Test implementation
    });

    it('should validate mode data', async () => {
      // Test implementation
    });
  });

  describe('likeMode', () => {
    it('should toggle like status', async () => {
      // Test implementation
    });

    it('should update likes count', async () => {
      // Test implementation
    });
  });
});
```

### 10.2 Integration Tests

```typescript
// tests/e2e/cloud-modes.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Cloud Modes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to catalog
    await page.goto('/catalog');
  });

  test('should browse public catalog without authentication', async ({ page }) => {
    // Wait for modes to load
    await page.waitForSelector('[data-testid="mode-card"]');

    // Should see mode cards
    const modeCards = await page.locator('[data-testid="mode-card"]').count();
    expect(modeCards).toBeGreaterThan(0);

    // Should see mode details
    await expect(page.locator('[data-testid="mode-card"]').first()).toContainText('mode');
  });

  test('should filter by category', async ({ page }) => {
    // Click category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=DAW Control');

    // URL should update
    expect(page.url()).toContain('category=daw-control');

    // Results should be filtered
    await page.waitForSelector('[data-testid="mode-card"]');
  });

  test('should search modes', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="search-input"]', 'ableton');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Results should be filtered
    await page.waitForSelector('[data-testid="mode-card"]');
    await expect(page.locator('[data-testid="mode-card"]').first()).toContainText('ableton', { ignoreCase: true });
  });

  test('should require authentication to create mode', async ({ page }) => {
    // Navigate to library
    await page.goto('/library');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('authenticated user can create mode', async ({ page, context }) => {
    // Sign in first (assumes auth is working)
    await page.goto('/login');
    await page.click('text=Continue with Google');
    // OAuth flow would happen here
    // For testing, mock authentication state

    // Navigate to library
    await page.goto('/library');

    // Click create mode
    await page.click('[data-testid="create-mode-button"]');

    // Fill form
    await page.fill('[data-testid="mode-name-input"]', 'Test Mode');
    await page.fill('[data-testid="mode-description-input"]', 'Test Description');
    await page.click('[data-testid="mode-category-select"]');
    await page.click('text=DAW Control');

    // Submit
    await page.click('[data-testid="submit-mode-button"]');

    // Should see success message
    await expect(page.locator('text=Mode created successfully')).toBeVisible();

    // Should appear in library
    await expect(page.locator('text=Test Mode')).toBeVisible();
  });

  test('authenticated user can like mode', async ({ page }) => {
    // Assume authentication
    await page.goto('/catalog');

    // Click first mode
    await page.click('[data-testid="mode-card"]');

    // Wait for detail page
    await page.waitForSelector('[data-testid="like-button"]');

    // Get initial like count
    const initialLikes = await page.locator('[data-testid="likes-count"]').textContent();

    // Click like button
    await page.click('[data-testid="like-button"]');

    // Likes should increment
    await expect(page.locator('[data-testid="likes-count"]')).not.toHaveText(initialLikes || '0');
  });

  test('authenticated user can fork mode', async ({ page }) => {
    // Assume authentication
    await page.goto('/modes/some-mode-id');

    // Click fork button
    await page.click('[data-testid="fork-button"]');

    // Fill fork dialog
    await page.fill('[data-testid="fork-name-input"]', 'Forked Mode');
    await page.click('[data-testid="confirm-fork-button"]');

    // Should redirect to library
    await expect(page).toHaveURL('/library');

    // Should see forked mode
    await expect(page.locator('text=Forked Mode')).toBeVisible();
  });
});
```

### 10.3 Coverage Requirements

- CloudModeService: 90%+
- React Query hooks: 85%+
- UI components: 80%+
- E2E critical paths: 100%

---

## 11. Acceptance Criteria

### Feature Completion

- [ ] Database schema created and RLS policies configured
- [ ] TypeScript types generated and integrated
- [ ] CloudModeService implements all CRUD operations
- [ ] React Query hooks for all cloud operations
- [ ] Catalog page shows public modes with filters
- [ ] Library page shows user's modes with CRUD actions
- [ ] Mode detail page with engagement features (like, rate, fork)
- [ ] Upload dialog for creating new modes
- [ ] Search functionality
- [ ] Pagination for mode lists
- [ ] Optimistic UI updates for likes
- [ ] Error handling and loading states
- [ ] Responsive design (mobile, tablet, desktop)

### Testing

- [ ] 85%+ test coverage
- [ ] All E2E tests pass
- [ ] All unit tests pass
- [ ] Manual testing checklist complete

### Security

- [ ] RLS policies enforce user ownership
- [ ] Input validation on all forms
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Rate limiting active

### Performance

- [ ] Catalog loads in < 2s (first load)
- [ ] Mode detail loads in < 1s
- [ ] Search results in < 1s
- [ ] Like/unlike responds in < 500ms (optimistic)
- [ ] Pagination smooth and instant

### Documentation

- [ ] API documentation (JSDoc comments)
- [ ] README updated with cloud features
- [ ] User guide for uploading modes
- [ ] Developer guide for extending features

---

## Appendices

### Appendix A: File Structure

```
xl3-web/
├── src/
│   ├── types/
│   │   ├── cloud-mode.ts                    # CloudMode types
│   │   └── supabase-database.ts             # Generated Supabase types
│   │
│   ├── lib/
│   │   └── services/
│   │       ├── cloud-mode-service.ts        # Main service
│   │       └── __tests__/
│   │           └── cloud-mode-service.test.ts
│   │
│   ├── hooks/
│   │   └── useCloudModes.ts                 # React Query hooks
│   │
│   ├── components/
│   │   └── mode/
│   │       ├── ModeCard.tsx                 # Mode card component
│   │       ├── ModeUploadDialog.tsx         # Upload dialog
│   │       ├── ModeFilters.tsx              # Filter sidebar
│   │       ├── LikeButton.tsx               # Like button
│   │       ├── RatingStars.tsx              # Rating component
│   │       └── ForkButton.tsx               # Fork button
│   │
│   └── pages/
│       ├── Catalog.tsx                      # Updated catalog
│       ├── Library.tsx                      # Updated library
│       └── ModeDetail.tsx                   # New detail page
│
├── supabase/
│   └── migrations/
│       ├── 001_modes_schema.sql             # Database schema
│       ├── 002_rls_policies.sql             # RLS policies
│       └── 003_rpc_functions.sql            # Database functions
│
└── tests/
    └── e2e/
        └── cloud-modes.spec.ts              # E2E tests
```

### Appendix B: Environment Variables

```bash
# .env.example

# Supabase (already configured from auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Future analytics
VITE_ANALYTICS_KEY=your-analytics-key
```

### Appendix C: Database Queries Reference

```typescript
// Common Supabase queries

// Get public modes with author info
const { data } = await supabase
  .from('modes')
  .select(`
    *,
    author:author_id (
      id,
      email,
      user_metadata
    )
  `)
  .eq('is_public', true);

// Check if user liked a mode
const { data } = await supabase
  .from('mode_likes')
  .select('*')
  .match({ user_id: userId, mode_id: modeId })
  .single();

// Get mode with engagement metrics
const { data } = await supabase
  .from('modes')
  .select(`
    *,
    user_liked:mode_likes!left (user_id),
    user_rating:mode_ratings!left (rating)
  `)
  .eq('id', modeId)
  .eq('mode_likes.user_id', userId)
  .eq('mode_ratings.user_id', userId)
  .single();

// Full-text search
const { data } = await supabase
  .from('modes')
  .select('*')
  .textSearch('fts', 'ableton live', {
    type: 'websearch',
    config: 'english'
  });

// Filter by tags (array contains)
const { data } = await supabase
  .from('modes')
  .select('*')
  .contains('tags', ['ableton', 'mixing']);
```

### Appendix D: Common Issues & Solutions

#### Issue: RLS policy denies access

**Solution:**
- Check user is authenticated: `supabase.auth.getUser()`
- Verify `author_id` matches `auth.uid()`
- Check mode is public if viewing as non-owner
- Review RLS policies in Supabase dashboard

#### Issue: Slow queries

**Solution:**
- Add indexes for frequently queried columns
- Use `select('*')` sparingly - only fetch needed columns
- Implement pagination
- Use React Query caching effectively

#### Issue: Optimistic update shows wrong state

**Solution:**
- Ensure `onMutate` creates accurate optimistic state
- Implement `onError` to rollback
- Use `onSettled` to refetch from server
- Check React Query devtools for cache state

#### Issue: User can't create mode

**Solution:**
- Verify user is authenticated
- Check RLS policy allows INSERT with `auth.uid() = author_id`
- Validate mode data matches schema
- Check Supabase logs for error details

---

**End of Workplan**
