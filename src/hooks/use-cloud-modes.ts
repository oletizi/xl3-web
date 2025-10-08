/**
 * React Query hooks for cloud mode operations
 *
 * This module provides React Query hooks for all CloudModeService operations,
 * including queries for fetching modes and mutations for modifying them.
 * Implements optimistic updates, cache invalidation, and proper error handling.
 *
 * @module hooks/use-cloud-modes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createCloudModeService } from '@/services/cloud-mode-service';
import type {
  CloudMode,
  ModeFilters,
  PaginatedResponse,
} from '@/services/cloud-mode-service';
import type { CustomMode } from '@/types/mode';

// ============================================================================
// SERVICE SINGLETON
// ============================================================================

/**
 * Singleton CloudModeService instance
 * Uses the global Supabase client
 */
const cloudModeService = createCloudModeService(supabase);

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Centralized query key factory for cloud modes
 *
 * Provides consistent query keys for React Query cache management.
 * Use these keys for all queries and cache invalidation.
 */
export const cloudModeKeys = {
  /** Base key for all cloud mode queries */
  all: ['cloud-modes'] as const,

  /** Base key for all mode lists */
  lists: () => [...cloudModeKeys.all, 'list'] as const,

  /** Key for a specific list with filters */
  list: (filters: ModeFilters) => [...cloudModeKeys.lists(), filters] as const,

  /** Key for user's private modes */
  myModes: () => [...cloudModeKeys.all, 'my-modes'] as const,

  /** Key for public modes catalog */
  publicModes: (filters: ModeFilters) =>
    [...cloudModeKeys.all, 'public', filters] as const,

  /** Base key for all mode details */
  details: () => [...cloudModeKeys.all, 'detail'] as const,

  /** Key for a specific mode by ID */
  detail: (id: string) => [...cloudModeKeys.details(), id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get all modes for the current user (private library)
 *
 * Fetches modes authored by the current user, including both public and private modes.
 * Requires authentication.
 *
 * @returns React Query result with user's modes
 *
 * @example
 * ```tsx
 * function MyLibrary() {
 *   const { data: modes, isLoading, error } = useMyModes();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <ModeList modes={modes} />;
 * }
 * ```
 */
export function useMyModes() {
  return useQuery({
    queryKey: cloudModeKeys.myModes(),
    queryFn: () => cloudModeService.getMyModes(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1, // Only retry once for auth errors
  });
}

/**
 * Get public modes with filters and pagination
 *
 * Fetches publicly visible modes from the catalog with optional filtering,
 * sorting, and pagination. Does not require authentication.
 *
 * @param filters - Filter, sort, and pagination options
 * @returns React Query result with paginated public modes
 *
 * @example
 * ```tsx
 * function Catalog() {
 *   const [page, setPage] = useState(1);
 *   const { data, isLoading } = usePublicModes({
 *     page,
 *     limit: 20,
 *     sort: 'recent',
 *     category: 'daw-control',
 *   });
 *
 *   return (
 *     <>
 *       <ModeGrid modes={data?.data} />
 *       <Pagination
 *         current={page}
 *         total={data?.pagination.totalPages}
 *         onChange={setPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function usePublicModes(filters: ModeFilters = {}) {
  return useQuery({
    queryKey: cloudModeKeys.publicModes(filters),
    queryFn: () => cloudModeService.getPublicModes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep old data while fetching
  });
}

/**
 * Get a specific mode by ID
 *
 * Fetches full details for a single mode. RLS policies determine if the user
 * can access the mode (public modes or user's own private modes).
 *
 * @param id - Mode ID to fetch
 * @returns React Query result with mode details
 *
 * @example
 * ```tsx
 * function ModeDetail({ modeId }: { modeId: string }) {
 *   const { data: mode, isLoading } = useModeById(modeId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!mode) return <NotFound />;
 *
 *   return <ModeDetailView mode={mode} />;
 * }
 * ```
 */
export function useModeById(id: string) {
  return useQuery({
    queryKey: cloudModeKeys.detail(id),
    queryFn: () => cloudModeService.getModeById(id),
    enabled: !!id, // Only run query if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Save a new mode to the cloud
 *
 * Creates a new mode in the database. The mode is initially private.
 * Requires authentication.
 *
 * @returns React Query mutation for creating modes
 *
 * @example
 * ```tsx
 * function SaveButton({ mode }: { mode: CustomMode }) {
 *   const saveMode = useSaveMode();
 *
 *   const handleSave = () => {
 *     saveMode.mutate(mode, {
 *       onSuccess: (savedMode) => {
 *         toast.success(`Mode "${savedMode.name}" saved!`);
 *         navigate(`/modes/${savedMode.id}`);
 *       },
 *       onError: (error) => {
 *         toast.error(`Failed to save: ${error.message}`);
 *       },
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleSave} disabled={saveMode.isPending}>
 *       {saveMode.isPending ? 'Saving...' : 'Save to Cloud'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSaveMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mode: CustomMode) => cloudModeService.saveMode(mode),
    onSuccess: (savedMode) => {
      // Invalidate my modes list to show the new mode
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.myModes() });

      // Add to cache for detail view
      queryClient.setQueryData(cloudModeKeys.detail(savedMode.id), savedMode);
    },
  });
}

/**
 * Update an existing mode
 *
 * Updates mode metadata and/or controls. Only the author can update their modes.
 * RLS policies enforce this restriction.
 *
 * @returns React Query mutation for updating modes
 *
 * @example
 * ```tsx
 * function EditModeForm({ mode }: { mode: CloudMode }) {
 *   const updateMode = useUpdateMode();
 *
 *   const handleSubmit = (updates: Partial<CloudMode>) => {
 *     updateMode.mutate(
 *       { modeId: mode.id, updates },
 *       {
 *         onSuccess: () => {
 *           toast.success('Mode updated!');
 *         },
 *       }
 *     );
 *   };
 *
 *   return <EditForm mode={mode} onSubmit={handleSubmit} />;
 * }
 * ```
 */
export function useUpdateMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modeId, updates }: { modeId: string; updates: Partial<CloudMode> }) =>
      cloudModeService.updateMode(modeId, updates),
    onSuccess: (updatedMode) => {
      // Update cache for detail view
      queryClient.setQueryData(cloudModeKeys.detail(updatedMode.id), updatedMode);

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.myModes() });
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.lists() });
    },
  });
}

/**
 * Delete a mode
 *
 * Permanently deletes a mode from the database. Only the author can delete their modes.
 * RLS policies enforce this restriction.
 *
 * @returns React Query mutation for deleting modes
 *
 * @example
 * ```tsx
 * function DeleteButton({ modeId }: { modeId: string }) {
 *   const deleteMode = useDeleteMode();
 *
 *   const handleDelete = () => {
 *     if (confirm('Are you sure? This cannot be undone.')) {
 *       deleteMode.mutate(modeId, {
 *         onSuccess: () => {
 *           toast.success('Mode deleted');
 *           navigate('/library');
 *         },
 *       });
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleDelete} disabled={deleteMode.isPending}>
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 */
export function useDeleteMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modeId: string) => cloudModeService.deleteMode(modeId),
    onSuccess: (_, modeId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: cloudModeKeys.detail(modeId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.myModes() });
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.lists() });
    },
  });
}

/**
 * Publish a mode (make it public)
 *
 * Makes a private mode visible in the public catalog. Only the author can publish their modes.
 * Sets the publishedAt timestamp.
 *
 * @returns React Query mutation for publishing modes
 *
 * @example
 * ```tsx
 * function PublishButton({ mode }: { mode: CloudMode }) {
 *   const publishMode = usePublishMode();
 *
 *   const handlePublish = () => {
 *     publishMode.mutate(mode.id, {
 *       onSuccess: () => {
 *         toast.success('Mode is now public!');
 *       },
 *     });
 *   };
 *
 *   if (mode.isPublic) {
 *     return <Badge>Public</Badge>;
 *   }
 *
 *   return (
 *     <button onClick={handlePublish} disabled={publishMode.isPending}>
 *       Publish
 *     </button>
 *   );
 * }
 * ```
 */
export function usePublishMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modeId: string) => cloudModeService.publishMode(modeId),
    onSuccess: (publishedMode) => {
      // Update cache
      queryClient.setQueryData(cloudModeKeys.detail(publishedMode.id), publishedMode);

      // Invalidate lists to show in public catalog
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.myModes() });
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.publicModes({}) });
    },
  });
}

/**
 * Unpublish a mode (make it private)
 *
 * Removes a mode from the public catalog. Only the author can unpublish their modes.
 * Clears the publishedAt timestamp.
 *
 * @returns React Query mutation for unpublishing modes
 *
 * @example
 * ```tsx
 * function UnpublishButton({ mode }: { mode: CloudMode }) {
 *   const unpublishMode = useUnpublishMode();
 *
 *   const handleUnpublish = () => {
 *     unpublishMode.mutate(mode.id, {
 *       onSuccess: () => {
 *         toast.success('Mode is now private');
 *       },
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleUnpublish} disabled={unpublishMode.isPending}>
 *       Make Private
 *     </button>
 *   );
 * }
 * ```
 */
export function useUnpublishMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modeId: string) => cloudModeService.unpublishMode(modeId),
    onSuccess: (unpublishedMode) => {
      // Update cache
      queryClient.setQueryData(cloudModeKeys.detail(unpublishedMode.id), unpublishedMode);

      // Invalidate lists to remove from public catalog
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.myModes() });
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.publicModes({}) });
    },
  });
}

/**
 * Like or unlike a mode (toggle)
 *
 * Toggles the like status for the current user. Uses optimistic updates for instant
 * feedback. Requires authentication.
 *
 * @returns React Query mutation for liking/unliking modes
 *
 * @example
 * ```tsx
 * function LikeButton({ mode }: { mode: CloudMode }) {
 *   const toggleLike = useLikeMode();
 *
 *   const handleClick = () => {
 *     toggleLike.mutate({
 *       modeId: mode.id,
 *       currentlyLiked: mode.userLiked || false,
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={toggleLike.isPending}>
 *       <Heart fill={mode.userLiked ? 'red' : 'none'} />
 *       {mode.likes}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLikeMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modeId,
      currentlyLiked,
    }: {
      modeId: string;
      currentlyLiked: boolean;
    }) => {
      if (currentlyLiked) {
        await cloudModeService.unlikeMode(modeId);
      } else {
        await cloudModeService.likeMode(modeId);
      }
    },
    onMutate: async ({ modeId, currentlyLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cloudModeKeys.detail(modeId) });

      // Snapshot previous value
      const previousMode = queryClient.getQueryData<CloudMode>(
        cloudModeKeys.detail(modeId)
      );

      // Optimistically update
      if (previousMode) {
        const optimisticMode: CloudMode = {
          ...previousMode,
          likes: currentlyLiked ? previousMode.likes - 1 : previousMode.likes + 1,
          userLiked: !currentlyLiked,
        };
        queryClient.setQueryData(cloudModeKeys.detail(modeId), optimisticMode);
      }

      return { previousMode };
    },
    onError: (err, { modeId }, context) => {
      // Rollback on error
      if (context?.previousMode) {
        queryClient.setQueryData(cloudModeKeys.detail(modeId), context.previousMode);
      }
    },
    onSettled: (data, error, { modeId }) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.detail(modeId) });
    },
  });
}

/**
 * Rate a mode with optional review
 *
 * Submits or updates a rating (1-5 stars) for a mode with optional review text.
 * Users can only rate once per mode (upsert behavior). Requires authentication.
 *
 * @returns React Query mutation for rating modes
 *
 * @example
 * ```tsx
 * function RatingForm({ modeId }: { modeId: string }) {
 *   const rateMode = useRateMode();
 *   const [rating, setRating] = useState(5);
 *   const [review, setReview] = useState('');
 *
 *   const handleSubmit = () => {
 *     rateMode.mutate(
 *       { modeId, rating, review },
 *       {
 *         onSuccess: () => {
 *           toast.success('Thanks for your rating!');
 *         },
 *       }
 *     );
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <StarRating value={rating} onChange={setRating} />
 *       <textarea value={review} onChange={(e) => setReview(e.target.value)} />
 *       <button type="submit" disabled={rateMode.isPending}>
 *         Submit Rating
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useRateMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modeId,
      rating,
      review,
    }: {
      modeId: string;
      rating: number;
      review?: string;
    }) => cloudModeService.rateMode(modeId, rating, review),
    onSuccess: (_, { modeId }) => {
      // Invalidate mode detail to refetch updated rating
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.detail(modeId) });

      // Invalidate lists if sort is by rating
      queryClient.invalidateQueries({ queryKey: cloudModeKeys.publicModes({}) });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if a mode is liked by the current user
 *
 * Convenience hook to determine like status without fetching full mode details.
 *
 * @param mode - Cloud mode to check
 * @returns True if user has liked the mode
 */
export function useIsLiked(mode: CloudMode | null | undefined): boolean {
  return mode?.userLiked || false;
}

/**
 * Get the current user's rating for a mode
 *
 * Convenience hook to get user's rating without additional queries.
 *
 * @param mode - Cloud mode to check
 * @returns User's rating (1-5) or undefined if not rated
 */
export function useUserRating(mode: CloudMode | null | undefined): number | undefined {
  return mode?.userRating;
}

/**
 * Check if the current user is the author of a mode
 *
 * Useful for conditionally showing edit/delete actions.
 *
 * @param mode - Cloud mode to check
 * @returns True if current user is the author
 */
export function useIsAuthor(mode: CloudMode | null | undefined): boolean {
  const { data: myModes } = useMyModes();
  if (!mode || !myModes) return false;
  return myModes.some((m) => m.id === mode.id);
}
