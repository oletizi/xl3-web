/**
 * CloudModeService - Interface-first service for cloud mode operations
 *
 * This service handles all CRUD operations and engagement features for cloud-stored
 * MIDI controller modes. Uses dependency injection for the Supabase client.
 *
 * @module services/cloud-mode-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { CustomMode } from '@/types/mode';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Pagination options for browsing modes
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'downloads' | 'likes' | 'rating';
}

/**
 * Filter options for browsing modes
 */
export interface ModeFilters extends PaginationOptions {
  category?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  search?: string;
}

/**
 * Cloud-stored mode with full metadata
 */
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

/**
 * Paginated response wrapper
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

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface ModeRow {
  id: string;
  author_id: string;
  name: string;
  description: string | null;
  version: string;
  controls: Record<string, unknown>;
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
 * Database insert type
 */
interface ModeInsert {
  id?: string;
  author_id: string;
  name: string;
  description?: string | null;
  version?: string;
  controls: Record<string, unknown>;
  is_public?: boolean;
  is_official?: boolean;
  is_featured?: boolean;
  tags?: string[];
  category?: string | null;
  thumbnail?: string | null;
  parent_mode_id?: string | null;
}

/**
 * Database update type
 */
interface ModeUpdate {
  name?: string;
  description?: string | null;
  version?: string;
  controls?: Record<string, unknown>;
  is_public?: boolean;
  tags?: string[];
  category?: string | null;
  thumbnail?: string | null;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Interface for cloud mode operations
 */
export interface ICloudModeService {
  /**
   * Save a custom mode to the cloud
   */
  saveMode(mode: CustomMode): Promise<CloudMode>;

  /**
   * Get all modes for the current user
   */
  getMyModes(): Promise<CloudMode[]>;

  /**
   * Get a specific mode by ID
   */
  getModeById(id: string): Promise<CloudMode | null>;

  /**
   * Update an existing mode
   */
  updateMode(id: string, updates: Partial<CloudMode>): Promise<CloudMode>;

  /**
   * Delete a mode
   */
  deleteMode(id: string): Promise<void>;

  /**
   * Publish a mode (make it public)
   */
  publishMode(id: string): Promise<CloudMode>;

  /**
   * Unpublish a mode (make it private)
   */
  unpublishMode(id: string): Promise<CloudMode>;

  /**
   * Get public modes with pagination and filters
   */
  getPublicModes(options: PaginationOptions): Promise<PaginatedResponse<CloudMode>>;

  /**
   * Like a mode (toggle)
   */
  likeMode(modeId: string): Promise<void>;

  /**
   * Unlike a mode (toggle)
   */
  unlikeMode(modeId: string): Promise<void>;

  /**
   * Rate a mode with optional review
   */
  rateMode(modeId: string, rating: number, review?: string): Promise<void>;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * CloudModeService implementation using Supabase
 */
export class CloudModeService implements ICloudModeService {
  /**
   * Supabase client injected via constructor
   */
  private readonly supabase: SupabaseClient;

  /**
   * Create a new CloudModeService
   *
   * @param supabase - Supabase client instance
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Convert database row to CloudMode
   *
   * @param row - Database row from Supabase
   * @returns CloudMode object
   */
  private toCloudMode(row: ModeRow): CloudMode {
    return {
      id: row.id,
      authorId: row.author_id,
      name: row.name,
      description: row.description || '',
      version: row.version,
      controls: row.controls as Record<string, unknown>,
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
   * Get current user ID from session
   *
   * @returns User ID
   * @throws Error if user is not authenticated
   */
  private async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      throw new Error('User not authenticated. Please sign in to continue.');
    }

    return user.id;
  }

  /**
   * Save a custom mode to the cloud
   *
   * @param mode - Custom mode to save
   * @returns Saved cloud mode
   */
  async saveMode(mode: CustomMode): Promise<CloudMode> {
    const userId = await this.getCurrentUserId();

    const insert: ModeInsert = {
      author_id: userId,
      name: mode.name,
      description: mode.description,
      version: mode.version,
      controls: mode.controls,
      is_public: false, // Default to private
      tags: [],
    };

    const { data, error } = await this.supabase
      .from('modes')
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save mode: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to save mode: No data returned from database');
    }

    return this.toCloudMode(data as ModeRow);
  }

  /**
   * Get all modes for the current user
   *
   * @returns Array of user's cloud modes
   */
  async getMyModes(): Promise<CloudMode[]> {
    const userId = await this.getCurrentUserId();

    const { data, error } = await this.supabase
      .from('modes')
      .select('*')
      .eq('author_id', userId)
      .order('modified_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user modes: ${error.message}`);
    }

    return (data || []).map((row) => this.toCloudMode(row as ModeRow));
  }

  /**
   * Get a specific mode by ID
   *
   * @param id - Mode ID
   * @returns Cloud mode or null if not found
   */
  async getModeById(id: string): Promise<CloudMode | null> {
    const { data, error } = await this.supabase
      .from('modes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch mode: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.toCloudMode(data as ModeRow);
  }

  /**
   * Update an existing mode
   *
   * @param id - Mode ID
   * @param updates - Partial updates to apply
   * @returns Updated cloud mode
   */
  async updateMode(id: string, updates: Partial<CloudMode>): Promise<CloudMode> {
    const update: ModeUpdate = {};

    if (updates.name !== undefined) update.name = updates.name;
    if (updates.description !== undefined) update.description = updates.description;
    if (updates.version !== undefined) update.version = updates.version;
    if (updates.controls !== undefined) update.controls = updates.controls;
    if (updates.isPublic !== undefined) update.is_public = updates.isPublic;
    if (updates.tags !== undefined) update.tags = updates.tags;
    if (updates.category !== undefined) update.category = updates.category;
    if (updates.thumbnail !== undefined) update.thumbnail = updates.thumbnail;

    const { data, error } = await this.supabase
      .from('modes')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update mode: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update mode: No data returned from database');
    }

    return this.toCloudMode(data as ModeRow);
  }

  /**
   * Delete a mode
   *
   * @param id - Mode ID
   */
  async deleteMode(id: string): Promise<void> {
    const { error } = await this.supabase.from('modes').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete mode: ${error.message}`);
    }
  }

  /**
   * Publish a mode (make it public)
   *
   * @param id - Mode ID
   * @returns Updated cloud mode
   */
  async publishMode(id: string): Promise<CloudMode> {
    const { data, error } = await this.supabase
      .from('modes')
      .update({
        is_public: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to publish mode: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to publish mode: No data returned from database');
    }

    return this.toCloudMode(data as ModeRow);
  }

  /**
   * Unpublish a mode (make it private)
   *
   * @param id - Mode ID
   * @returns Updated cloud mode
   */
  async unpublishMode(id: string): Promise<CloudMode> {
    const { data, error } = await this.supabase
      .from('modes')
      .update({
        is_public: false,
        published_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unpublish mode: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to unpublish mode: No data returned from database');
    }

    return this.toCloudMode(data as ModeRow);
  }

  /**
   * Get public modes with pagination and filters
   *
   * @param options - Pagination options
   * @returns Paginated response with cloud modes
   */
  async getPublicModes(
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<CloudMode>> {
    const { page = 1, limit = 20, sort = 'recent' } = options;

    let query = this.supabase
      .from('modes')
      .select('*', { count: 'exact' })
      .eq('is_public', true);

    // Apply sorting
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

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch public modes: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []).map((row) => this.toCloudMode(row as ModeRow)),
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
   * Like a mode (toggle)
   *
   * @param modeId - Mode ID
   */
  async likeMode(modeId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    // Check if already liked
    const { data: existingLike } = await this.supabase
      .from('mode_likes')
      .select('*')
      .match({ user_id: userId, mode_id: modeId })
      .single();

    if (existingLike) {
      // Already liked, do nothing (unlikeMode should be called instead)
      return;
    }

    // Insert like
    const { error: likeError } = await this.supabase
      .from('mode_likes')
      .insert({ user_id: userId, mode_id: modeId });

    if (likeError) {
      throw new Error(`Failed to like mode: ${likeError.message}`);
    }

    // Increment likes count
    const { error: updateError } = await this.supabase.rpc('increment_likes', {
      mode_id: modeId,
    });

    if (updateError) {
      throw new Error(`Failed to update likes count: ${updateError.message}`);
    }
  }

  /**
   * Unlike a mode (toggle)
   *
   * @param modeId - Mode ID
   */
  async unlikeMode(modeId: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    // Delete like
    const { error: unlikeError } = await this.supabase
      .from('mode_likes')
      .delete()
      .match({ user_id: userId, mode_id: modeId });

    if (unlikeError) {
      throw new Error(`Failed to unlike mode: ${unlikeError.message}`);
    }

    // Decrement likes count
    const { error: updateError } = await this.supabase.rpc('decrement_likes', {
      mode_id: modeId,
    });

    if (updateError) {
      throw new Error(`Failed to update likes count: ${updateError.message}`);
    }
  }

  /**
   * Rate a mode with optional review
   *
   * @param modeId - Mode ID
   * @param rating - Rating value (1-5)
   * @param review - Optional review text
   */
  async rateMode(modeId: string, rating: number, review?: string): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { error } = await this.supabase.from('mode_ratings').upsert({
      user_id: userId,
      mode_id: modeId,
      rating,
      review: review || null,
    });

    if (error) {
      throw new Error(`Failed to rate mode: ${error.message}`);
    }

    // Rating aggregate is updated by database trigger
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a CloudModeService instance
 *
 * @param supabase - Supabase client instance
 * @returns CloudModeService instance
 */
export function createCloudModeService(supabase: SupabaseClient): ICloudModeService {
  return new CloudModeService(supabase);
}
