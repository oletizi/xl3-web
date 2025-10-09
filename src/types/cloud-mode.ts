/**
 * Cloud Mode Storage Type Definitions
 *
 * This module provides TypeScript types for cloud-based mode storage, sharing,
 * and engagement features. All types align with the Supabase database schema
 * and extend the base CustomMode interface.
 *
 * @module types/cloud-mode
 */

import { z } from 'zod';
import { CustomMode, ControlMapping } from '@/types/mode';

// ============================================================================
// ENUMS AND LITERAL TYPES
// ============================================================================

/**
 * Predefined mode categories for organizing and filtering modes
 */
export type ModeCategory =
  | 'daw-control'
  | 'live-performance'
  | 'mixing-mastering'
  | 'instrument-control'
  | 'genre-specific'
  | 'educational';

/**
 * Mode visibility levels
 */
export type ModeVisibility = 'private' | 'public' | 'unlisted';

/**
 * Sorting options for mode lists
 */
export type ModeSortOption = 'recent' | 'downloads' | 'likes' | 'rating' | 'views';

// ============================================================================
// CORE CLOUD MODE INTERFACE
// ============================================================================

/**
 * CloudMode extends CustomMode with cloud storage metadata and engagement metrics
 *
 * This interface represents a mode stored in the cloud with full metadata,
 * ownership information, and engagement tracking. It is the primary type used
 * throughout the application for cloud-stored modes.
 */
export interface CloudMode extends CustomMode {
  // Unique identification
  /** UUID assigned by database */
  id: string;

  // Ownership
  /** UUID of the user who created this mode */
  authorId: string;

  /** Optional author details (populated via join) */
  author?: CloudModeAuthor;

  // Visibility flags
  /** Whether mode is visible in public catalog */
  isPublic: boolean;

  /** Marks official/verified modes from trusted sources */
  isOfficial: boolean;

  /** Featured modes shown prominently in UI */
  isFeatured: boolean;

  // Engagement metrics (denormalized for performance)
  /** Total number of times mode has been downloaded */
  downloads: number;

  /** Total number of likes from users */
  likes: number;

  /** Total number of times mode detail page was viewed */
  views: number;

  /** Average rating (0-5, decimal) */
  rating: number;

  /** Total number of ratings submitted */
  ratingCount: number;

  /** Number of times this mode has been forked */
  forkCount: number;

  // Discovery metadata
  /** Search and filtering tags */
  tags: string[];

  /** Primary category for organization */
  category?: ModeCategory;

  /** Base64 image or URL to thumbnail (future: Supabase Storage) */
  thumbnail?: string;

  // Relationships
  /** UUID of parent mode if this is a fork */
  parentModeId?: string;

  /** Optional parent mode details (populated via join) */
  parentMode?: CloudMode;

  // Timestamps
  /** When mode was first published (null if never published) */
  publishedAt?: string;

  // Client-side computed properties (not in database)
  /** Whether current user has liked this mode */
  userLiked?: boolean;

  /** Current user's rating (1-5) if they rated this mode */
  userRating?: number;
}

/**
 * Author information attached to cloud modes
 */
export interface CloudModeAuthor {
  id: string;
  screenName: string;
  avatarUrl?: string;
}

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

/**
 * Database row type for modes table (snake_case to match PostgreSQL)
 *
 * Used for direct Supabase queries and type safety at the database boundary.
 * Convert to CloudMode interface for application use.
 */
export interface ModesTableRow {
  id: string;
  author_id: string;
  name: string;
  description: string | null;
  version: string;
  controls: Record<string, ControlMapping>;
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
}

/**
 * Insert type for modes table (fields required for INSERT)
 */
export interface ModesTableInsert {
  id?: string;
  author_id: string;
  name: string;
  description?: string | null;
  version?: string;
  controls: Record<string, ControlMapping>;
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
}

/**
 * Update type for modes table (all fields optional)
 */
export interface ModesTableUpdate {
  id?: string;
  author_id?: string;
  name?: string;
  description?: string | null;
  version?: string;
  controls?: Record<string, ControlMapping>;
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
}

// ============================================================================
// ENGAGEMENT TYPES
// ============================================================================

/**
 * Database row for mode_likes table
 */
export interface ModeLike {
  userId: string;
  modeId: string;
  createdAt: string;
}

/**
 * Database row type for mode_likes table (snake_case)
 */
export interface ModeLikesTableRow {
  user_id: string;
  mode_id: string;
  created_at: string;
}

/**
 * Database row for mode_ratings table
 */
export interface ModeRating {
  userId: string;
  modeId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row type for mode_ratings table (snake_case)
 */
export interface ModeRatingsTableRow {
  user_id: string;
  mode_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Aggregate engagement metrics for a mode
 */
export interface ModeEngagement {
  /** Whether current user has liked this mode */
  liked: boolean;

  /** Total number of likes */
  likesCount: number;

  /** Current user's rating (1-5) if they rated */
  userRating?: number;

  /** Average rating across all users */
  averageRating: number;

  /** Total number of ratings */
  ratingCount: number;
}

// ============================================================================
// VERSION HISTORY TYPES
// ============================================================================

/**
 * Mode version history entry
 *
 * Tracks changes to a mode over time, storing complete control configurations
 * for each version.
 */
export interface ModeVersion {
  id: string;
  modeId: string;
  version: string; // Semantic version (e.g., "1.2.3")
  changes: string; // Changelog/release notes
  controls: Record<string, ControlMapping>;
  createdAt: string;
}

/**
 * Database row type for mode_versions table (snake_case)
 */
export interface ModeVersionsTableRow {
  id: string;
  mode_id: string;
  version: string;
  changes: string | null;
  controls: Record<string, ControlMapping>;
  created_at: string;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/**
 * Mode category definition
 */
export interface Category {
  id: ModeCategory;
  name: string;
  description: string;
  icon?: string;
  displayOrder: number;
}

/**
 * Database row type for categories table (snake_case)
 */
export interface CategoriesTableRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

// ============================================================================
// METADATA AND FILTER TYPES
// ============================================================================

/**
 * Metadata for creating or updating a cloud mode
 *
 * Contains non-control data needed to describe and categorize a mode.
 */
export interface CloudModeMetadata {
  name: string;
  description: string;
  tags: string[];
  category?: ModeCategory;
  isPublic: boolean;
  thumbnail?: string;
}

/**
 * Filter and query options for browsing modes
 *
 * Used to build database queries with filtering, sorting, and pagination.
 */
export interface ModeFilters {
  /** Filter by category */
  category?: ModeCategory;

  /** Filter by tags (modes must have ALL specified tags) */
  tags?: string[];

  /** Filter by author */
  authorId?: string;

  /** Filter by public/private status */
  isPublic?: boolean;

  /** Filter featured modes only */
  isFeatured?: boolean;

  /** Sort order */
  sort?: ModeSortOption;

  /** Full-text search query */
  search?: string;

  /** Pagination: page number (1-based) */
  page?: number;

  /** Pagination: items per page */
  limit?: number;
}

/**
 * Paginated response wrapper
 *
 * Standard format for paginated API responses with metadata.
 */
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

// ============================================================================
// API OPERATION TYPES
// ============================================================================

/**
 * Parameters for creating a new cloud mode
 */
export interface CreateModeParams {
  mode: CustomMode;
  metadata: CloudModeMetadata;
}

/**
 * Parameters for updating an existing mode
 */
export interface UpdateModeParams {
  modeId: string;
  updates: Partial<CloudMode>;
}

/**
 * Parameters for forking a mode
 */
export interface ForkModeParams {
  modeId: string;
  overrides?: {
    name?: string;
    description?: string;
  };
}

/**
 * Parameters for rating a mode
 */
export interface RateModeParams {
  modeId: string;
  rating: number; // 1-5
  review?: string;
}

/**
 * Response from like/unlike operation
 */
export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

/**
 * Response from rating operation
 */
export interface RatingResponse {
  averageRating: number;
  ratingCount: number;
}

// ============================================================================
// VALIDATION SCHEMAS (ZOD)
// ============================================================================

/**
 * Zod schema for ControlMapping validation
 */
export const ControlMappingSchema = z.object({
  id: z.string(),
  type: z.enum(['knob', 'fader', 'button']),
  ccNumber: z.number().int().min(0).max(127),
  midiChannel: z.number().int().min(1).max(16),
  minValue: z.number().int().min(0).max(127),
  maxValue: z.number().int().min(0).max(127),
  label: z.string().max(50).optional(),
});

/**
 * Zod schema for CloudModeMetadata validation
 */
export const CloudModeMetadataSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_().]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less'),
  tags: z.array(z.string().max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed'),
  category: z.enum([
    'daw-control',
    'live-performance',
    'mixing-mastering',
    'instrument-control',
    'genre-specific',
    'educational',
  ]).optional(),
  isPublic: z.boolean(),
  thumbnail: z.string().optional(),
});

/**
 * Zod schema for mode version string validation (semantic versioning)
 */
export const ModeVersionSchema = z.string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (e.g., 1.0.0)');

/**
 * Zod schema for rating validation
 */
export const RatingSchema = z.number()
  .int('Rating must be an integer')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

/**
 * Zod schema for review text validation
 */
export const ReviewSchema = z.string()
  .max(2000, 'Review must be 2000 characters or less')
  .optional();

/**
 * Zod schema for ModeFilters validation
 */
export const ModeFiltersSchema = z.object({
  category: z.enum([
    'daw-control',
    'live-performance',
    'mixing-mastering',
    'instrument-control',
    'genre-specific',
    'educational',
  ]).optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sort: z.enum(['recent', 'downloads', 'likes', 'rating', 'views']).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a mode is a CloudMode
 */
export function isCloudMode(mode: CustomMode | CloudMode): mode is CloudMode {
  return 'id' in mode && 'authorId' in mode;
}

/**
 * Type guard to check if a mode is public
 */
export function isPublicMode(mode: CloudMode): boolean {
  return mode.isPublic === true;
}

/**
 * Type guard to check if a mode is featured
 */
export function isFeaturedMode(mode: CloudMode): boolean {
  return mode.isFeatured === true;
}

/**
 * Type guard to check if a mode is forked
 */
export function isForkedMode(mode: CloudMode): boolean {
  return mode.parentModeId !== undefined && mode.parentModeId !== null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract only the fields that can be updated by users
 */
export type UpdatableCloudModeFields = Pick<
  CloudMode,
  'name' | 'description' | 'version' | 'controls' | 'isPublic' | 'tags' | 'category' | 'thumbnail'
>;

/**
 * Omit computed/derived fields from CloudMode
 */
export type CloudModeWithoutComputed = Omit<CloudMode, 'userLiked' | 'userRating' | 'author' | 'parentMode'>;

/**
 * Mode summary for list views (minimal fields for performance)
 */
export interface CloudModeSummary {
  id: string;
  name: string;
  description: string;
  authorId: string;
  category?: ModeCategory;
  tags: string[];
  thumbnail?: string;
  downloads: number;
  likes: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  modifiedAt: string;
}
