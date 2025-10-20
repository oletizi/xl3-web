import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveModeToStorage, loadModeFromStorage, clearModeFromStorage } from '@/utils/statePersistence';
import type { CustomMode } from '@/types/mode';

describe('statePersistence', () => {
  // Mock localStorage
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Reset store and clear mock calls
    mockLocalStorage.clear();
    vi.clearAllMocks();

    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  const createValidMode = (): CustomMode => ({
    name: 'Test Mode',
    description: 'A test mode',
    version: '1.0.0',
    controls: {
      'knob-cc13': {
        id: 'knob-cc13',
        type: 'knob',
        ccNumber: 13,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
        label: 'Test Knob',
      },
    },
    createdAt: '2025-01-01T00:00:00Z',
    modifiedAt: '2025-01-01T00:00:00Z',
  });

  describe('saveModeToStorage', () => {
    it('should save a valid mode to localStorage', () => {
      const mode = createValidMode();
      saveModeToStorage(mode);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lcxl3-editor-mode',
        JSON.stringify(mode)
      );
    });

    it('should handle modes with empty controls', () => {
      const mode = { ...createValidMode(), controls: {} };
      saveModeToStorage(mode);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lcxl3-editor-mode',
        JSON.stringify(mode)
      );
    });

    it('should handle modes with special characters in name', () => {
      const mode = { ...createValidMode(), name: 'Test "Mode" with \'quotes\' & symbols' };
      saveModeToStorage(mode);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      expect(() => JSON.parse(savedData)).not.toThrow();
    });

    it('should handle localStorage quota exceeded error gracefully', () => {
      const mode = createValidMode();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => saveModeToStorage(mode)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save mode to localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON serialization errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a circular reference that will fail JSON.stringify
      const mode = createValidMode() as any;
      mode.circular = mode;

      expect(() => saveModeToStorage(mode)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save mode to localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadModeFromStorage', () => {
    it('should return null when no mode is stored', () => {
      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should load a valid mode from localStorage', () => {
      const mode = createValidMode();
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(mode));

      const result = loadModeFromStorage();
      expect(result).toEqual(mode);
    });

    it('should return null for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.setItem('lcxl3-editor-mode', 'invalid json {');

      const result = loadModeFromStorage();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should return null for mode without name', () => {
      const invalidMode = { ...createValidMode(), name: undefined };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(invalidMode));

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for mode with empty string name', () => {
      const invalidMode = { ...createValidMode(), name: '' };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(invalidMode));

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for mode without controls', () => {
      const invalidMode = { name: 'Test' };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(invalidMode));

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for mode with non-object controls', () => {
      const invalidMode = { name: 'Test', controls: 'not an object' };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(invalidMode));

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should accept mode with array controls (typeof [] === object)', () => {
      // Note: The implementation accepts arrays since typeof [] === 'object'
      // This is a limitation of JavaScript's typeof operator
      const modeWithArrayControls = { name: 'Test', controls: [] };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(modeWithArrayControls));

      const result = loadModeFromStorage();
      expect(result).toEqual(modeWithArrayControls);
    });

    it('should return null for mode with null controls', () => {
      const invalidMode = { name: 'Test', controls: null };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(invalidMode));

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should handle localStorage access error gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = loadModeFromStorage();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string from localStorage', () => {
      mockLocalStorage.setItem('lcxl3-editor-mode', '');

      const result = loadModeFromStorage();
      expect(result).toBeNull();
    });

    it('should load mode with all optional fields', () => {
      const mode = createValidMode();
      mode.controls['fader-cc5'] = {
        id: 'fader-cc5',
        type: 'fader',
        ccNumber: 5,
        midiChannel: 2,
        minValue: 10,
        maxValue: 100,
      };
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(mode));

      const result = loadModeFromStorage();
      expect(result).toEqual(mode);
    });
  });

  describe('clearModeFromStorage', () => {
    it('should remove mode from localStorage', () => {
      const mode = createValidMode();
      mockLocalStorage.setItem('lcxl3-editor-mode', JSON.stringify(mode));

      clearModeFromStorage();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-editor-mode');
      expect(mockLocalStorage.getItem('lcxl3-editor-mode')).toBeNull();
    });

    it('should not throw when localStorage is empty', () => {
      expect(() => clearModeFromStorage()).not.toThrow();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-editor-mode');
    });

    it('should handle localStorage access error gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      expect(() => clearModeFromStorage()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should save and load the same mode', () => {
      const mode = createValidMode();
      saveModeToStorage(mode);

      const loaded = loadModeFromStorage();
      expect(loaded).toEqual(mode);
    });

    it('should handle save, clear, and load cycle', () => {
      const mode = createValidMode();
      saveModeToStorage(mode);

      clearModeFromStorage();

      const loaded = loadModeFromStorage();
      expect(loaded).toBeNull();
    });

    it('should overwrite existing mode on save', () => {
      const mode1 = createValidMode();
      const mode2 = { ...createValidMode(), name: 'Different Mode' };

      saveModeToStorage(mode1);
      saveModeToStorage(mode2);

      const loaded = loadModeFromStorage();
      expect(loaded?.name).toBe('Different Mode');
    });
  });
});
