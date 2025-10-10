import type { CustomMode } from '@/types/mode';
import type { LCXL3CustomMode } from '@/utils/modeConverter';
import { lcxl3ModeToCustomMode } from '@/utils/modeConverter';

/**
 * Simple hash function for mode data
 */
function hashMode(mode: CustomMode): string {
  // Create a stable representation of controls only
  const controlsKeys = Object.keys(mode.controls).sort();
  const controlsData = controlsKeys.map(key => {
    const c = mode.controls[key];
    return `${key}:${c.ccNumber}:${c.midiChannel}:${c.minValue}:${c.maxValue}`;
  }).join('|');

  // Simple hash (not cryptographic, just for comparison)
  let hash = 0;
  for (let i = 0; i < controlsData.length; i++) {
    const char = controlsData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Compare two modes for equality (ignoring timestamps/metadata)
 */
export function modesAreEqual(a: CustomMode, b: CustomMode): boolean {
  return hashMode(a) === hashMode(b);
}

/**
 * Check if edit buffer matches device slot
 */
export async function checkSlotSync(
  editBuffer: CustomMode,
  deviceMode: LCXL3CustomMode
): Promise<boolean> {
  const convertedDeviceMode = lcxl3ModeToCustomMode(deviceMode);
  return modesAreEqual(editBuffer, convertedDeviceMode);
}

export type SyncStatus = 'synced' | 'modified' | 'syncing' | 'unknown';

/**
 * Sync tracker that uses optimistic updates
 */
export class SyncTracker {
  private lastKnownDeviceHash: string | null = null;
  private lastEditBufferHash: string | null = null;

  /**
   * Mark that we just fetched from device
   */
  markFetched(mode: CustomMode): void {
    const hash = hashMode(mode);
    this.lastKnownDeviceHash = hash;
    this.lastEditBufferHash = hash;
  }

  /**
   * Mark that we just sent to device
   */
  markSent(mode: CustomMode): void {
    const hash = hashMode(mode);
    this.lastKnownDeviceHash = hash;
    this.lastEditBufferHash = hash;
  }

  /**
   * Mark that edit buffer changed
   */
  markEdited(mode: CustomMode): void {
    this.lastEditBufferHash = hashMode(mode);
  }

  /**
   * Get sync status without device read
   */
  getOptimisticStatus(): SyncStatus {
    if (this.lastKnownDeviceHash === null) return 'unknown';
    if (this.lastEditBufferHash === null) return 'unknown';

    return this.lastKnownDeviceHash === this.lastEditBufferHash
      ? 'synced'
      : 'modified';
  }

  /**
   * Reset tracker (e.g., when switching slots)
   */
  reset(): void {
    this.lastKnownDeviceHash = null;
    this.lastEditBufferHash = null;
  }
}
