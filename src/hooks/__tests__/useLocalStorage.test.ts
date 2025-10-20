import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CustomMode } from '@/types/mode';

// Create mock functions
const mockSave = vi.fn();
const mockLoad = vi.fn();
const mockClear = vi.fn();
const mockGetSavedAt = vi.fn();
const mockGetStorageSize = vi.fn();

// Mock the LocalStorageManager module
vi.mock('@/lib/storage/local-storage', () => ({
  LocalStorageManager: vi.fn().mockImplementation(() => ({
    save: mockSave,
    load: mockLoad,
    clear: mockClear,
    getSavedAt: mockGetSavedAt,
    getStorageSize: mockGetStorageSize,
  })),
}));

describe('useLocalStorage', () => {
  let mockMode: CustomMode;

  beforeEach(() => {
    vi.useFakeTimers();

    // Reset all mocks
    mockSave.mockClear();
    mockLoad.mockClear();
    mockClear.mockClear();
    mockGetSavedAt.mockClear();
    mockGetStorageSize.mockClear();

    // Default mock returns
    mockLoad.mockReturnValue(null);
    mockSave.mockReturnValue(true);

    mockMode = {
      name: 'Test Mode',
      description: 'Test Description',
      version: '1.0.0',
      controls: {},
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should load from storage on mount', () => {
      const onLoadSuccess = vi.fn();

      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadSuccess,
        })
      );

      expect(mockLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onLoadSuccess when data is loaded', () => {
      const onLoadSuccess = vi.fn();
      const savedMode: CustomMode = {
        ...mockMode,
        name: 'Saved Mode',
      };
      mockLoad.mockReturnValue(savedMode);

      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadSuccess,
        })
      );

      expect(onLoadSuccess).toHaveBeenCalledWith(savedMode);
    });

    it('should call onLoadError when loading fails', () => {
      const onLoadError = vi.fn();
      const error = new Error('Load failed');
      mockLoad.mockImplementation(() => {
        throw error;
      });

      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadError,
        })
      );

      expect(onLoadError).toHaveBeenCalledWith(error);
    });

    it('should not call onLoadSuccess if storage returns null', () => {
      const onLoadSuccess = vi.fn();

      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadSuccess,
        })
      );

      expect(onLoadSuccess).not.toHaveBeenCalled();
    });
  });

  describe('manual save', () => {
    it('should save mode when saveToStorage is called', () => {
      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      act(() => {
        result.current.saveToStorage();
      });

      expect(mockSave).toHaveBeenCalledWith(mockMode);
    });

    it('should call onSaveSuccess when save succeeds', () => {
      const onSaveSuccess = vi.fn();

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onSaveSuccess,
        })
      );

      act(() => {
        result.current.saveToStorage();
      });

      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveError when save fails', () => {
      const onSaveError = vi.fn();
      const error = new Error('Save failed');
      mockSave.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onSaveError,
        })
      );

      act(() => {
        result.current.saveToStorage();
      });

      expect(onSaveError).toHaveBeenCalledWith(error);
    });

    it('should not save if mode JSON has not changed', () => {
      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      // Save once
      act(() => {
        result.current.saveToStorage();
      });

      expect(mockSave).toHaveBeenCalledTimes(1);

      // Save again with same mode
      act(() => {
        result.current.saveToStorage();
      });

      // Should not save again (lastSavedRef optimization)
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should save if mode content has changed', () => {
      const { result, rerender } = renderHook(
        ({ mode }) =>
          useLocalStorage(mode, false, {
            autoSave: false,
          }),
        { initialProps: { mode: mockMode } }
      );

      // Save once
      act(() => {
        result.current.saveToStorage();
      });

      expect(mockSave).toHaveBeenCalledTimes(1);

      // Update mode
      const updatedMode = { ...mockMode, name: 'Updated Mode' };
      rerender({ mode: updatedMode });

      // Save again with updated mode
      act(() => {
        result.current.saveToStorage();
      });

      // Should save again
      expect(mockSave).toHaveBeenCalledTimes(2);
      expect(mockSave).toHaveBeenLastCalledWith(updatedMode);
    });
  });

  describe('auto save', () => {
    it('should auto save when isDirty changes to true', () => {
      const { rerender } = renderHook(
        ({ mode, isDirty }) =>
          useLocalStorage(mode, isDirty, {
            autoSave: true,
          }),
        {
          initialProps: { mode: mockMode, isDirty: false },
        }
      );

      expect(mockSave).not.toHaveBeenCalled();

      // Change isDirty to true
      rerender({ mode: mockMode, isDirty: true });

      // Fast-forward debounce timer (2000ms)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSave).toHaveBeenCalledWith(mockMode);
    });

    it('should debounce auto save (cancel previous timeout)', () => {
      const { rerender } = renderHook(
        ({ mode, isDirty }) =>
          useLocalStorage(mode, isDirty, {
            autoSave: true,
          }),
        {
          initialProps: { mode: mockMode, isDirty: true },
        }
      );

      // Change mode multiple times quickly
      const updatedMode1 = { ...mockMode, name: 'Updated 1' };
      rerender({ mode: updatedMode1, isDirty: true });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const updatedMode2 = { ...mockMode, name: 'Updated 2' };
      rerender({ mode: updatedMode2, isDirty: true });

      // Should only save once after debounce completes
      expect(mockSave).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(updatedMode2);
    });

    it('should not auto save when autoSave is false', () => {
      renderHook(() =>
        useLocalStorage(mockMode, true, {
          autoSave: false,
        })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should not auto save when isDirty is false', () => {
      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: true,
        })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should cleanup timeout on unmount', () => {
      const { unmount } = renderHook(() =>
        useLocalStorage(mockMode, true, {
          autoSave: true,
        })
      );

      unmount();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not save after unmount
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('clear storage', () => {
    it('should clear storage when clearStorage is called', () => {
      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      act(() => {
        result.current.clearStorage();
      });

      expect(mockClear).toHaveBeenCalledTimes(1);
    });

    it('should reset last saved ref after clearing', () => {
      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      // Save first
      act(() => {
        result.current.saveToStorage();
      });

      expect(mockSave).toHaveBeenCalledTimes(1);

      // Clear
      act(() => {
        result.current.clearStorage();
      });

      // Save again with same mode
      act(() => {
        result.current.saveToStorage();
      });

      // Should save again since ref was cleared
      expect(mockSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSavedAt', () => {
    it('should return saved timestamp', () => {
      const savedDate = new Date('2023-01-01');
      mockGetSavedAt.mockReturnValue(savedDate);

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      const timestamp = result.current.getSavedAt();

      expect(timestamp).toBe(savedDate);
      expect(mockGetSavedAt).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStorageSize', () => {
    it('should return storage size', () => {
      mockGetStorageSize.mockReturnValue(1024);

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
        })
      );

      const size = result.current.getStorageSize();

      expect(size).toBe(1024);
      expect(mockGetStorageSize).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadFromStorage', () => {
    it('should manually load from storage', () => {
      const onLoadSuccess = vi.fn();
      const savedMode: CustomMode = {
        ...mockMode,
        name: 'Manually Loaded',
      };

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadSuccess,
        })
      );

      // Now return data
      mockLoad.mockReturnValue(savedMode);

      act(() => {
        result.current.loadFromStorage();
      });

      // Called once on mount, once manually
      expect(mockLoad).toHaveBeenCalledTimes(2);
      expect(onLoadSuccess).toHaveBeenCalledWith(savedMode);
    });
  });

  describe('error handling', () => {
    it('should handle non-Error objects in save error', () => {
      const onSaveError = vi.fn();
      mockSave.mockImplementation(() => {
        throw 'String error';
      });

      const { result } = renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onSaveError,
        })
      );

      act(() => {
        result.current.saveToStorage();
      });

      expect(onSaveError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to save',
        })
      );
    });

    it('should handle non-Error objects in load error', () => {
      const onLoadError = vi.fn();
      mockLoad.mockImplementation(() => {
        throw 'String error';
      });

      renderHook(() =>
        useLocalStorage(mockMode, false, {
          autoSave: false,
          onLoadError,
        })
      );

      expect(onLoadError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to load',
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle mode updates during auto-save debounce', () => {
      const { rerender } = renderHook(
        ({ mode, isDirty }) =>
          useLocalStorage(mode, isDirty, {
            autoSave: true,
          }),
        {
          initialProps: { mode: mockMode, isDirty: true },
        }
      );

      // Update mode
      const updatedMode = { ...mockMode, name: 'Updated Mode' };
      rerender({ mode: updatedMode, isDirty: true });

      // Advance timer partially
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Update mode again
      const updatedMode2 = { ...mockMode, name: 'Updated Mode 2' };
      rerender({ mode: updatedMode2, isDirty: true });

      // Complete debounce
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSave).toHaveBeenCalledWith(updatedMode2);
    });

    it('should handle rapid isDirty toggle', () => {
      const { rerender } = renderHook(
        ({ mode, isDirty }) =>
          useLocalStorage(mode, isDirty, {
            autoSave: true,
          }),
        {
          initialProps: { mode: mockMode, isDirty: false },
        }
      );

      // Toggle isDirty multiple times
      rerender({ mode: mockMode, isDirty: true });
      rerender({ mode: mockMode, isDirty: false });
      rerender({ mode: mockMode, isDirty: true });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockSave).toHaveBeenCalledWith(mockMode);
    });

    it('should not trigger auto save if mode becomes clean before debounce', () => {
      const { rerender } = renderHook(
        ({ mode, isDirty }) =>
          useLocalStorage(mode, isDirty, {
            autoSave: true,
          }),
        {
          initialProps: { mode: mockMode, isDirty: true },
        }
      );

      // Make it clean before debounce finishes
      rerender({ mode: mockMode, isDirty: false });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not have saved
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should handle callback dependency changes', () => {
      const onSaveSuccess1 = vi.fn();
      const onSaveSuccess2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onSuccess }) =>
          useLocalStorage(mockMode, false, {
            autoSave: false,
            onSaveSuccess: onSuccess,
          }),
        {
          initialProps: { onSuccess: onSaveSuccess1 },
        }
      );

      act(() => {
        result.current.saveToStorage();
      });

      expect(onSaveSuccess1).toHaveBeenCalledTimes(1);
      expect(onSaveSuccess2).not.toHaveBeenCalled();

      // Change the callback
      rerender({ onSuccess: onSaveSuccess2 });

      act(() => {
        result.current.saveToStorage();
      });

      // Note: due to lastSavedRef optimization, save won't be called again
      // But if it were, it would use the new callback
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });
});
