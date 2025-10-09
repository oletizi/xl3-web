/**
 * UserProfileService - Interface-first service for user profile operations
 *
 * This service handles user profile management including screen name selection
 * and updates. Uses dependency injection for the Supabase client.
 *
 * @module services/user-profile-service
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  screenName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface UserProfileRow {
  id: string;
  screen_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Interface for user profile operations
 */
export interface IUserProfileService {
  /**
   * Get the current user's profile
   */
  getUserProfile(): Promise<UserProfile>;

  /**
   * Generate multiple screen name options
   *
   * @param count Number of options to generate (default: 10)
   * @returns Array of available screen names
   */
  generateScreenNameOptions(count?: number): Promise<string[]>;

  /**
   * Update the user's screen name
   *
   * @param newScreenName The new screen name to set
   * @throws Error if screen name is already taken
   */
  updateScreenName(newScreenName: string): Promise<UserProfile>;

  /**
   * Validate that a screen name is available
   *
   * @param screenName Screen name to validate
   * @returns true if available, false if taken
   */
  validateScreenNameAvailable(screenName: string): Promise<boolean>;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * UserProfileService implementation using Supabase
 */
export class UserProfileService implements IUserProfileService {
  /**
   * Supabase client injected via constructor
   */
  private readonly supabase: SupabaseClient;

  /**
   * Create a new UserProfileService
   *
   * @param supabase - Supabase client instance
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
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
      throw new Error('User not authenticated. Please sign in to access profile.');
    }

    return user.id;
  }

  /**
   * Convert database row to UserProfile
   *
   * @param row - Database row from Supabase
   * @returns UserProfile object
   */
  private toUserProfile(row: UserProfileRow): UserProfile {
    return {
      id: row.id,
      screenName: row.screen_name,
      avatarUrl: row.avatar_url || undefined,
      bio: row.bio || undefined,
      createdAt: row.created_at,
      modifiedAt: row.updated_at,
    };
  }

  /**
   * Get the current user's profile
   */
  async getUserProfile(): Promise<UserProfile> {
    const userId = await this.getCurrentUserId();

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('User profile not found. Profile should exist for authenticated users.');
    }

    return this.toUserProfile(data as UserProfileRow);
  }

  /**
   * Generate multiple screen name options
   *
   * @param count Number of options to generate (default: 10)
   * @returns Array of available screen names
   */
  async generateScreenNameOptions(count: number = 10): Promise<string[]> {
    const { data, error } = await this.supabase
      .rpc('generate_screen_name_batch', { count });

    if (error) {
      throw new Error(`Failed to generate screen name options: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to generate screen name options. Please try again.');
    }

    return data.map((row: { screen_name: string }) => row.screen_name);
  }

  /**
   * Update the user's screen name
   *
   * @param newScreenName The new screen name to set
   * @throws Error if screen name is already taken
   */
  async updateScreenName(newScreenName: string): Promise<UserProfile> {
    const userId = await this.getCurrentUserId();

    // Validate screen name is available
    const isAvailable = await this.validateScreenNameAvailable(newScreenName);
    if (!isAvailable) {
      throw new Error(`Screen name "${newScreenName}" is already taken. Please choose another.`);
    }

    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({ screen_name: newScreenName })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update screen name: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update screen name. No data returned from database.');
    }

    return this.toUserProfile(data as UserProfileRow);
  }

  /**
   * Validate that a screen name is available
   *
   * @param screenName Screen name to validate
   * @returns true if available, false if taken
   */
  async validateScreenNameAvailable(screenName: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('validate_screen_name_available', { name: screenName });

    if (error) {
      throw new Error(`Failed to validate screen name: ${error.message}`);
    }

    return data === true;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a UserProfileService instance
 *
 * @param supabase - Supabase client instance
 * @returns UserProfileService instance
 */
export function createUserProfileService(supabase: SupabaseClient): IUserProfileService {
  return new UserProfileService(supabase);
}
