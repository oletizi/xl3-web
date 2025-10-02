import type { CustomMode } from '@/types/mode';

const STORAGE_KEY = 'lcxl3-editor-mode';

export function saveModeToStorage(mode: CustomMode): void {
  try {
    const json = JSON.stringify(mode);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save mode to localStorage:', error);
  }
}

export function loadModeFromStorage(): CustomMode | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const mode = JSON.parse(json);

    if (!mode.name || !mode.controls || typeof mode.controls !== 'object') {
      return null;
    }

    return mode;
  } catch (error) {
    console.error('Failed to load mode from localStorage:', error);
    return null;
  }
}

export function clearModeFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear mode from localStorage:', error);
  }
}