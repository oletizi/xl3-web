/**
 * UserProfileService Tests
 *
 * Comprehensive test coverage for user profile operations including:
 * - Profile retrieval
 * - Screen name generation
 * - Screen name updates
 * - Screen name validation
 * - Error handling
 * - Data transformation (snake_case to camelCase)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfileService,
  IUserProfileService,
  UserProfile,
  createUserProfileService,
} from '@/services/user-profile-service';

// ============================================================================
// Mock Supabase Client
// ============================================================================

/**
 * Create a mock Supabase client for testing
 */
function createMockSupabaseClient(): jest.Mocked<SupabaseClient> {
  return {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  } as unknown as jest.Mocked<SupabaseClient>;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('UserProfileService', () => {
  let service: IUserProfileService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new UserProfileService(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('createUserProfileService', () => {
    it('should create a UserProfileService instance', () => {
      const instance = createUserProfileService(mockSupabase);
      expect(instance).toBeInstanceOf(UserProfileService);
    });

    it('should implement IUserProfileService interface', () => {
      const instance = createUserProfileService(mockSupabase);
      expect(instance.getUserProfile).toBeDefined();
      expect(instance.generateScreenNameOptions).toBeDefined();
      expect(instance.updateScreenName).toBeDefined();
      expect(instance.validateScreenNameAvailable).toBeDefined();
    });
  });

  // ==========================================================================
  // getUserProfile Tests
  // ==========================================================================

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockUserId = 'user-123';
      const mockProfileRow = {
        id: mockUserId,
        screen_name: 'happy-panda-42',
        avatar_url: null,
        bio: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Mock auth.getUser
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await service.getUserProfile();

      expect(result).toEqual({
        id: mockUserId,
        screenName: 'happy-panda-42',
        avatarUrl: undefined,
        bio: undefined,
        createdAt: '2025-01-01T00:00:00Z',
        modifiedAt: '2025-01-01T00:00:00Z',
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockUserId);
    });

    it('should transform snake_case DB fields to camelCase', async () => {
      const mockProfileRow = {
        id: 'user-456',
        screen_name: 'clever-falcon-99',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        created_at: '2025-02-01T00:00:00Z',
        updated_at: '2025-02-02T00:00:00Z',
      };

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfileRow,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await service.getUserProfile();

      expect(result.screenName).toBe('clever-falcon-99');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.bio).toBe('Test bio');
      expect(result.createdAt).toBe('2025-02-01T00:00:00Z');
      expect(result.modifiedAt).toBe('2025-02-02T00:00:00Z');
    });

    it('should throw error when user not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(service.getUserProfile()).rejects.toThrow(
        'User not authenticated. Please sign in to access profile.'
      );
    });

    it('should throw error when profile not found', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.getUserProfile()).rejects.toThrow(
        'User profile not found. Profile should exist for authenticated users.'
      );
    });

    it('should throw error when database query fails', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.getUserProfile()).rejects.toThrow(
        'Failed to fetch user profile: Database connection failed'
      );
    });
  });

  // ==========================================================================
  // generateScreenNameOptions Tests
  // ==========================================================================

  describe('generateScreenNameOptions', () => {
    it('should generate 10 screen names by default', async () => {
      const mockNames = Array.from({ length: 10 }, (_, i) => ({
        screen_name: `test-name-${i}`,
      }));

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: mockNames,
        error: null,
      });

      const result = await service.generateScreenNameOptions();

      expect(result).toHaveLength(10);
      expect(result).toEqual([
        'test-name-0',
        'test-name-1',
        'test-name-2',
        'test-name-3',
        'test-name-4',
        'test-name-5',
        'test-name-6',
        'test-name-7',
        'test-name-8',
        'test-name-9',
      ]);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_screen_name_batch', {
        count: 10,
      });
    });

    it('should generate custom count of screen names', async () => {
      const mockNames = Array.from({ length: 5 }, (_, i) => ({
        screen_name: `custom-name-${i}`,
      }));

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: mockNames,
        error: null,
      });

      const result = await service.generateScreenNameOptions(5);

      expect(result).toHaveLength(5);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_screen_name_batch', {
        count: 5,
      });
    });

    it('should throw error when generation fails', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Generation failed' },
      });

      await expect(service.generateScreenNameOptions()).rejects.toThrow(
        'Failed to generate screen name options: Generation failed'
      );
    });

    it('should throw error when no names generated', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(service.generateScreenNameOptions()).rejects.toThrow(
        'Failed to generate screen name options. Please try again.'
      );
    });

    it('should throw error when data is null', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.generateScreenNameOptions()).rejects.toThrow(
        'Failed to generate screen name options. Please try again.'
      );
    });
  });

  // ==========================================================================
  // updateScreenName Tests
  // ==========================================================================

  describe('updateScreenName', () => {
    it('should update screen name when available', async () => {
      const mockUserId = 'user-123';
      const newScreenName = 'cool-cat-99';
      const updatedProfile = {
        id: mockUserId,
        screen_name: newScreenName,
        avatar_url: null,
        bio: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      // Mock auth.getUser
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock availability check (rpc)
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      // Mock update query
      const mockSingle = jest.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await service.updateScreenName(newScreenName);

      expect(result.screenName).toBe(newScreenName);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_screen_name_available', {
        name: newScreenName,
      });
      expect(mockUpdate).toHaveBeenCalledWith({ screen_name: newScreenName });
      expect(mockEq).toHaveBeenCalledWith('id', mockUserId);
    });

    it('should throw error when name is already taken', async () => {
      const takenName = 'taken-name-123';

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      // Mock availability check returning false
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: false,
        error: null,
      });

      await expect(service.updateScreenName(takenName)).rejects.toThrow(
        `Screen name "${takenName}" is already taken. Please choose another.`
      );
    });

    it('should throw error when user not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(service.updateScreenName('new-name')).rejects.toThrow(
        'User not authenticated. Please sign in to access profile.'
      );
    });

    it('should throw error when update fails', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null,
      });

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      await expect(service.updateScreenName('new-name')).rejects.toThrow(
        'Failed to update screen name: Update failed'
      );
    });

    it('should throw error when no data returned after update', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-999' } },
        error: null,
      });

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      await expect(service.updateScreenName('new-name')).rejects.toThrow(
        'Failed to update screen name. No data returned from database.'
      );
    });
  });

  // ==========================================================================
  // validateScreenNameAvailable Tests
  // ==========================================================================

  describe('validateScreenNameAvailable', () => {
    it('should return true when name is available', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await service.validateScreenNameAvailable('available-name');

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_screen_name_available', {
        name: 'available-name',
      });
    });

    it('should return false when name is taken', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await service.validateScreenNameAvailable('taken-name');

      expect(result).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_screen_name_available', {
        name: 'taken-name',
      });
    });

    it('should throw error when validation fails', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Validation error' },
      });

      await expect(service.validateScreenNameAvailable('test-name')).rejects.toThrow(
        'Failed to validate screen name: Validation error'
      );
    });
  });
});
