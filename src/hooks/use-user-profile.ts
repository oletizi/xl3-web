/**
 * React Query hooks for user profile operations
 *
 * Provides hooks for fetching and updating user profiles, including screen name
 * selection. Implements optimistic updates, cache management, and error handling.
 *
 * @module hooks/use-user-profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createUserProfileService } from '@/services/user-profile-service';
import type { UserProfile } from '@/services/user-profile-service';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// SERVICE SINGLETON
// ============================================================================

/**
 * Singleton UserProfileService instance
 * Uses the global Supabase client
 */
const userProfileService = createUserProfileService(supabase);

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Centralized query key factory for user profile
 *
 * Provides consistent query keys for React Query cache management.
 */
export const userProfileKeys = {
  /** Base key for all user profile queries */
  all: ['userProfile'] as const,

  /** Key for current user's profile */
  profile: () => [...userProfileKeys.all, 'current'] as const,

  /** Key for screen name options with count */
  screenNameOptions: (count: number) => [...userProfileKeys.all, 'screenNameOptions', count] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch current user profile
 *
 * Fetches the authenticated user's profile including screen name and avatar.
 * Requires authentication.
 *
 * @returns React Query result with user profile
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { data: profile, isLoading, error } = useUserProfile();
 *
 *   if (isLoading) return <ProfileSkeleton />;
 *   if (error) return <ProfileError error={error} />;
 *
 *   return <ProfileHeader profile={profile} />;
 * }
 * ```
 */
export function useUserProfile() {
  return useQuery({
    queryKey: userProfileKeys.profile(),
    queryFn: () => userProfileService.getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1, // Only retry once for auth errors
  });
}

/**
 * Hook to generate screen name options
 *
 * Generates a batch of unique screen name options for user selection.
 * Does not cache results (always fetches fresh names).
 *
 * @param count Number of options to generate (default: 10)
 * @returns React Query result with screen name array
 *
 * @example
 * ```tsx
 * function ScreenNamePicker() {
 *   const { data: options, isLoading, refetch } = useGenerateScreenNames(10);
 *
 *   const handleRegenerate = () => {
 *     refetch();
 *   };
 *
 *   return (
 *     <>
 *       {options?.map(name => <NameOption key={name} name={name} />)}
 *       <Button onClick={handleRegenerate}>Regenerate</Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useGenerateScreenNames(count: number = 10) {
  return useQuery({
    queryKey: userProfileKeys.screenNameOptions(count),
    queryFn: () => userProfileService.generateScreenNameOptions(count),
    staleTime: 0, // Always fetch fresh names
    gcTime: 0, // Don't cache
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to update user's screen name with optimistic updates
 *
 * Updates the user's screen name with immediate UI feedback via optimistic updates.
 * Automatically rolls back on error and shows toast notifications.
 *
 * @returns React Query mutation for updating screen name
 *
 * @example
 * ```tsx
 * function ScreenNameSection({ profile }) {
 *   const [selected, setSelected] = useState<string>();
 *   const updateScreenName = useUpdateScreenName();
 *
 *   const handleSave = () => {
 *     if (selected) {
 *       updateScreenName.mutate(selected);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <ScreenNamePicker onSelect={setSelected} />
 *       <Button onClick={handleSave} disabled={updateScreenName.isPending}>
 *         Save
 *       </Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useUpdateScreenName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newScreenName: string) => userProfileService.updateScreenName(newScreenName),

    // Optimistic update
    onMutate: async (newScreenName: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userProfileKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(
        userProfileKeys.profile()
      );

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(
          userProfileKeys.profile(),
          {
            ...previousProfile,
            screenName: newScreenName,
          }
        );
      }

      return { previousProfile };
    },

    // Rollback on error
    onError: (error, newScreenName, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          userProfileKeys.profile(),
          context.previousProfile
        );
      }

      toast({
        title: 'Failed to Update Screen Name',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },

    // Success
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(
        userProfileKeys.profile(),
        updatedProfile
      );

      toast({
        title: 'Screen Name Updated',
        description: `Your screen name is now "${updatedProfile.screenName}"`,
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userProfileKeys.profile() });
    },
  });
}

/**
 * Hook to validate screen name availability
 *
 * Checks if a screen name is available without updating the profile.
 * Useful for real-time validation.
 *
 * @returns React Query mutation for validation
 *
 * @example
 * ```tsx
 * function ScreenNameValidator({ name }) {
 *   const validateName = useValidateScreenName();
 *
 *   const handleCheck = async () => {
 *     const isAvailable = await validateName.mutateAsync(name);
 *     console.log(`${name} is ${isAvailable ? 'available' : 'taken'}`);
 *   };
 *
 *   return <Button onClick={handleCheck}>Check Availability</Button>;
 * }
 * ```
 */
export function useValidateScreenName() {
  return useMutation({
    mutationFn: (screenName: string) => userProfileService.validateScreenNameAvailable(screenName),
  });
}
