/**
 * ModeCard Component
 *
 * A reusable card component for displaying mode information in catalog and library views.
 * Displays mode metadata, engagement metrics, author information, and provides
 * action buttons based on user permissions (like, load, edit, delete, share).
 *
 * Features:
 * - Responsive design for mobile, tablet, and desktop
 * - Optimistic like updates
 * - Conditional action buttons based on authorship
 * - Loading states for all async actions
 * - Toast notifications for success/error feedback
 * - Click card to view details
 *
 * @module components/cloud-storage/ModeCard
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  Download,
  Eye,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  PlayCircle,
  Lock,
  Globe,
  Loader2,
} from 'lucide-react';

import { CloudMode } from '@/types/cloud-mode';
import {
  useIsLiked,
  useIsAuthor,
  useLikeMode,
  useDeleteMode,
  usePublishMode,
  useUnpublishMode,
} from '@/hooks/use-cloud-modes';
import { cn } from '@/lib/utils';
import {
  formatCategory,
  formatRating,
  formatMetric,
  getInitials,
  truncateDescription,
} from '@/components/cloud-storage/mode-card-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';

// ============================================================================
// TYPES
// ============================================================================

/**
 * ModeCard component props
 */
export interface ModeCardProps {
  /** Mode data to display */
  mode: CloudMode;

  /** Callback when card is clicked to view details */
  onSelect?: (mode: CloudMode) => void;

  /** Callback when load button is clicked */
  onLoad?: (mode: CloudMode) => void;

  /** Callback when edit button is clicked */
  onEdit?: (mode: CloudMode) => void;

  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ModeCard Component
 *
 * Displays mode information with engagement metrics and action buttons.
 * Supports responsive layouts and optimistic UI updates.
 *
 * @example
 * ```tsx
 * <ModeCard
 *   mode={cloudMode}
 *   onSelect={(mode) => navigate(`/modes/${mode.id}`)}
 *   onLoad={(mode) => applyModeToController(mode)}
 *   onEdit={(mode) => openEditDialog(mode)}
 * />
 * ```
 */
export function ModeCard({
  mode,
  onSelect,
  onLoad,
  onEdit,
  className,
}: ModeCardProps): React.ReactElement {
  const isLiked = useIsLiked(mode);
  const isAuthor = useIsAuthor(mode);
  const likeMutation = useLikeMode();
  const deleteMutation = useDeleteMode();
  const publishMutation = usePublishMode();
  const unpublishMutation = useUnpublishMode();

  /**
   * Handle like/unlike action
   */
  const handleLike = (e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent card click

    likeMutation.mutate(
      {
        modeId: mode.id,
        currentlyLiked: isLiked,
      },
      {
        onError: (error) => {
          toast.error('Failed to update like', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    );
  };

  /**
   * Handle load mode action
   */
  const handleLoad = (e: React.MouseEvent): void => {
    e.stopPropagation();

    if (onLoad) {
      onLoad(mode);
      toast.success('Opening in Editor', {
        description: `${mode.name} is ready to edit.`,
      });
    }
  };

  /**
   * Handle edit mode action
   */
  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();

    if (onEdit) {
      onEdit(mode);
    }
  };

  /**
   * Handle delete mode action
   */
  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();

    const confirmed = confirm(
      `Are you sure you want to delete "${mode.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteMutation.mutate(mode.id, {
      onSuccess: () => {
        toast.success('Mode Deleted', {
          description: `${mode.name} has been permanently deleted.`,
        });
      },
      onError: (error) => {
        toast.error('Failed to Delete Mode', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      },
    });
  };

  /**
   * Handle publish/unpublish toggle
   */
  const handleTogglePublish = (e: React.MouseEvent): void => {
    e.stopPropagation();

    if (mode.isPublic) {
      unpublishMutation.mutate(mode.id, {
        onSuccess: () => {
          toast.success('Mode Unpublished', {
            description: `${mode.name} is now private.`,
          });
        },
        onError: (error) => {
          toast.error('Failed to Unpublish', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      });
    } else {
      publishMutation.mutate(mode.id, {
        onSuccess: () => {
          toast.success('Mode Published', {
            description: `${mode.name} is now visible in the public catalog.`,
          });
        },
        onError: (error) => {
          toast.error('Failed to Publish', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      });
    }
  };

  /**
   * Handle share action (copy link to clipboard)
   */
  const handleShare = (e: React.MouseEvent): void => {
    e.stopPropagation();

    const url = `${window.location.origin}/modes/${mode.id}`;

    navigator.clipboard.writeText(url).then(
      () => {
        toast.success('Link Copied', {
          description: 'Share link copied to clipboard.',
        });
      },
      () => {
        toast.error('Failed to Copy', {
          description: 'Could not copy link to clipboard.',
        });
      }
    );
  };

  /**
   * Handle card click to view details
   */
  const handleCardClick = (): void => {
    if (onSelect) {
      onSelect(mode);
    }
  };

  // Determine if any mutation is in progress
  const isLoading =
    likeMutation.isPending ||
    deleteMutation.isPending ||
    publishMutation.isPending ||
    unpublishMutation.isPending;

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all hover:shadow-md',
        'cursor-pointer select-none',
        isLoading && 'opacity-50 pointer-events-none',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Mode title and category */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{mode.name}</CardTitle>
            {mode.category && (
              <Badge variant="outline" className="mt-1">
                {formatCategory(mode.category)}
              </Badge>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onLoad && (
                <DropdownMenuItem onClick={handleLoad}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Load Mode
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>

              {isAuthor && (
                <>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Mode
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleTogglePublish}>
                    {mode.isPublic ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Mode
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Author information */}
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={mode.author?.avatarUrl} alt={mode.author?.screenName} />
            <AvatarFallback className="text-xs">
              {getInitials(mode.author?.screenName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {mode.author?.screenName || 'Unknown Author'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        {/* Description */}
        <CardDescription className="line-clamp-3">
          {mode.description ? truncateDescription(mode.description) : 'No description provided.'}
        </CardDescription>

        {/* Tags */}
        {mode.tags && mode.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {mode.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {mode.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{mode.tags.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3 border-t">
        {/* Engagement metrics */}
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          {/* Left side metrics */}
          <div className="flex items-center gap-3">
            {/* Rating */}
            {mode.rating > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{formatRating(mode.rating)}</span>
                    <span className="text-xs">({formatMetric(mode.ratingCount)})</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {mode.ratingCount} {mode.ratingCount === 1 ? 'rating' : 'ratings'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Downloads */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{formatMetric(mode.downloads)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {mode.downloads} {mode.downloads === 1 ? 'download' : 'downloads'}
              </TooltipContent>
            </Tooltip>

            {/* Views */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatMetric(mode.views)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {mode.views} {mode.views === 1 ? 'view' : 'views'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right side - created date */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs">
                {formatDistanceToNow(new Date(mode.createdAt), { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Created {new Date(mode.createdAt).toLocaleDateString()}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full">
          {/* Like button */}
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="flex-1"
          >
            <Heart
              className={cn('h-4 w-4 mr-1', isLiked && 'fill-current')}
            />
            {formatMetric(mode.likes)}
          </Button>

          {/* Load button */}
          {onLoad && (
            <Button variant="outline" size="sm" onClick={handleLoad} className="flex-1">
              <PlayCircle className="h-4 w-4 mr-1" />
              Load
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
