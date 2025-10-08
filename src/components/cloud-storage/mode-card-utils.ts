/**
 * ModeCard Utility Functions
 *
 * Helper functions for formatting and displaying mode data in the ModeCard component.
 *
 * @module components/cloud-storage/mode-card-utils
 */

/**
 * Format category for display
 *
 * @param category - Raw category string (e.g., "daw-control")
 * @returns Formatted category string (e.g., "DAW Control")
 */
export function formatCategory(category: string | undefined): string {
  if (!category) return 'Uncategorized';

  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get initials from name or email
 *
 * @param name - User's display name
 * @param email - User's email address
 * @returns Two-character initials
 */
export function getInitials(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

/**
 * Format star rating for display
 *
 * @param rating - Numeric rating value
 * @returns Formatted rating string with one decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Format large numbers with K/M suffix
 *
 * @param value - Numeric value to format
 * @returns Formatted string with K or M suffix for large numbers
 *
 * @example
 * formatMetric(1234) // "1.2K"
 * formatMetric(1234567) // "1.2M"
 * formatMetric(42) // "42"
 */
export function formatMetric(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Truncate description text
 *
 * @param text - Description text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateDescription(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
