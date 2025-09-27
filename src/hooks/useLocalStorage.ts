import { useEffect, useRef, useCallback } from 'react';
import { CustomMode } from '@/types/mode';
import { LocalStorageManager } from '@/lib/storage/local-storage';

const AUTOSAVE_DEBOUNCE_MS = 2000;

interface UseLocalStorageOptions {
  autoSave: boolean;
  onLoadSuccess?: (mode: CustomMode) => void;
  onLoadError?: (error: Error) => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useLocalStorage(
  mode: CustomMode,
  isDirty: boolean,
  options: UseLocalStorageOptions
) {
  const storageManager = useRef(new LocalStorageManager());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef<string>('');

  const saveToStorage = useCallback(() => {
    try {
      const modeJson = JSON.stringify(mode);

      if (modeJson === lastSavedRef.current) {
        return;
      }

      storageManager.current.save(mode);
      lastSavedRef.current = modeJson;
      options.onSaveSuccess?.();
    } catch (error) {
      options.onSaveError?.(error instanceof Error ? error : new Error('Failed to save'));
    }
  }, [mode, options]);

  const loadFromStorage = useCallback(() => {
    try {
      const loaded = storageManager.current.load();
      if (loaded) {
        lastSavedRef.current = JSON.stringify(loaded);
        options.onLoadSuccess?.(loaded);
      }
    } catch (error) {
      options.onLoadError?.(error instanceof Error ? error : new Error('Failed to load'));
    }
  }, [options]);

  const clearStorage = useCallback(() => {
    storageManager.current.clear();
    lastSavedRef.current = '';
  }, []);

  const getSavedAt = useCallback(() => {
    return storageManager.current.getSavedAt();
  }, []);

  const getStorageSize = useCallback(() => {
    return storageManager.current.getStorageSize();
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!options.autoSave || !isDirty) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [mode, isDirty, options.autoSave, saveToStorage]);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    getSavedAt,
    getStorageSize,
  };
}