/**
 * Save Mode Dialog Component
 *
 * A dialog component for saving the current mode configuration to the cloud.
 * Provides a comprehensive form for metadata entry including name, description,
 * category, tags, and visibility settings.
 *
 * @module components/cloud-storage/SaveModeDialog
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';

import { CustomMode } from '@/types/mode';
import { CloudModeMetadata, ModeCategory } from '@/types/cloud-mode';
import { useSaveMode } from '@/hooks/use-cloud-modes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Form schema using Zod for validation
 * Matches CloudModeMetadata structure with added UI state
 */
const saveModeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_().]+$/, 'Name contains invalid characters'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .default(''),
  category: z.enum([
    'daw-control',
    'live-performance',
    'mixing-mastering',
    'instrument-control',
    'genre-specific',
    'educational',
  ]).optional(),
  tags: z
    .string()
    .max(300, 'Tags input is too long')
    .transform((val) =>
      val
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
    .refine((tags) => tags.length <= 10, {
      message: 'Maximum 10 tags allowed',
    })
    .refine((tags) => tags.every((tag) => tag.length <= 30), {
      message: 'Each tag must be 30 characters or less',
    })
    .default(''),
  isPublic: z.boolean().default(false),
});

type SaveModeFormValues = z.infer<typeof saveModeFormSchema>;

/**
 * Category display metadata for the select dropdown
 */
const CATEGORY_OPTIONS: Array<{ value: ModeCategory; label: string; description: string }> = [
  {
    value: 'daw-control',
    label: 'DAW Control',
    description: 'Digital Audio Workstation control configurations',
  },
  {
    value: 'live-performance',
    label: 'Live Performance',
    description: 'Real-time performance and stage setups',
  },
  {
    value: 'mixing-mastering',
    label: 'Mixing & Mastering',
    description: 'Studio mixing and mastering configurations',
  },
  {
    value: 'instrument-control',
    label: 'Instrument Control',
    description: 'Virtual instrument and plugin control',
  },
  {
    value: 'genre-specific',
    label: 'Genre-Specific',
    description: 'Configurations optimized for specific music genres',
  },
  {
    value: 'educational',
    label: 'Educational',
    description: 'Teaching and learning configurations',
  },
];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface SaveModeDialogProps {
  /** The mode to be saved to the cloud */
  mode: CustomMode;

  /** Whether the dialog is currently open */
  open: boolean;

  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;

  /** Optional callback after successful save */
  onSuccess?: (modeId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SaveModeDialog Component
 *
 * Provides a form-based dialog for saving a CustomMode to the cloud with
 * comprehensive metadata including name, description, category, tags, and
 * visibility settings.
 *
 * @example
 * ```tsx
 * <SaveModeDialog
 *   mode={currentMode}
 *   open={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   onSuccess={(id) => console.log('Saved:', id)}
 * />
 * ```
 */
export function SaveModeDialog({
  mode,
  open,
  onOpenChange,
  onSuccess,
}: SaveModeDialogProps): React.ReactElement {
  const { saveMode, isLoading } = useSaveMode();

  // Initialize form with default values from the mode
  const form = useForm<SaveModeFormValues>({
    resolver: zodResolver(saveModeFormSchema),
    defaultValues: {
      name: mode.name || '',
      description: mode.description || '',
      category: undefined,
      tags: '',
      isPublic: false,
    },
  });

  // Reset form when dialog opens with new mode
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: mode.name || '',
        description: mode.description || '',
        category: undefined,
        tags: '',
        isPublic: false,
      });
    }
  }, [open, mode, form]);

  /**
   * Handle form submission
   */
  const onSubmit = async (values: SaveModeFormValues): Promise<void> => {
    try {
      // Transform form values into CloudModeMetadata
      const metadata: CloudModeMetadata = {
        name: values.name,
        description: values.description,
        tags: typeof values.tags === 'string' ? [] : values.tags,
        category: values.category,
        isPublic: values.isPublic,
      };

      // Save mode to cloud
      const result = await saveMode({ mode, metadata });

      // Show success notification
      toast.success('Mode Saved Successfully', {
        description: `${values.name} has been saved to the cloud.`,
      });

      // Close dialog
      onOpenChange(false);

      // Trigger success callback
      if (onSuccess && result?.id) {
        onSuccess(result.id);
      }
    } catch (error) {
      // Error handling - show user-friendly message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast.error('Failed to Save Mode', {
        description: errorMessage,
      });

      console.error('Save mode error:', error);
    }
  };

  /**
   * Handle dialog close with unsaved changes warning
   */
  const handleOpenChange = (newOpen: boolean): void => {
    // If closing and form is dirty, could add confirmation here
    if (!newOpen && form.formState.isDirty && !isLoading) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) {
        return;
      }
    }

    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Mode to Cloud</DialogTitle>
          <DialogDescription>
            Share your mode configuration with the community or save it privately for your own use.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Mode"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for your mode configuration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what makes this mode special and how it should be used..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand the purpose and benefits of your mode.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{category.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {category.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the category that best fits your mode.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Field */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ableton, mixing, creative (comma-separated)"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add up to 10 comma-separated tags to help others discover your mode.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Public Visibility Checkbox */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this mode public</FormLabel>
                    <FormDescription>
                      Public modes are visible to all users and can be downloaded from the community library.
                      Private modes are only visible to you.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Dialog Footer with Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Cloud
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
