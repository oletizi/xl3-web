import { CustomMode } from '@/types/mode';

const STORAGE_KEY = 'xl3-web-current-mode';
const STORAGE_VERSION = 1;

interface StorageData {
  version: number;
  mode: CustomMode;
  savedAt: string;
}

export class LocalStorageManager {
  private isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  save(mode: CustomMode): boolean {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    try {
      const data: StorageData = {
        version: STORAGE_VERSION,
        mode,
        savedAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please export your mode and clear some space.');
      }
      throw new Error(`Failed to save mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  load(): CustomMode | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized) as StorageData;

      if (data.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, clearing stored data');
        this.clear();
        return null;
      }

      return data.mode;
    } catch (error) {
      console.error('Failed to load mode from storage:', error);
      return null;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  getSavedAt(): Date | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized) as StorageData;
      return new Date(data.savedAt);
    } catch {
      return null;
    }
  }

  getStorageSize(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return 0;
      }

      return new Blob([serialized]).size;
    } catch {
      return 0;
    }
  }
}