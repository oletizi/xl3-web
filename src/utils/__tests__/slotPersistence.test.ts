import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveActiveSlot,
  loadActiveSlot,
  saveSlotNames,
  loadSlotNames,
  clearSlotData,
} from '@/utils/slotPersistence';

describe('slotPersistence', () => {
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

  describe('saveActiveSlot', () => {
    it('should save a valid slot index', () => {
      saveActiveSlot(5);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lcxl3-active-slot', '5');
    });

    it('should save slot index 0', () => {
      saveActiveSlot(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lcxl3-active-slot', '0');
    });

    it('should save slot index 14 (max)', () => {
      saveActiveSlot(14);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lcxl3-active-slot', '14');
    });

    it('should throw error for negative slot index', () => {
      expect(() => saveActiveSlot(-1)).toThrow('Invalid slot index: -1');
    });

    it('should throw error for slot index 15 (out of range)', () => {
      expect(() => saveActiveSlot(15)).toThrow('Invalid slot index: 15');
    });

    it('should throw error for slot index > 15', () => {
      expect(() => saveActiveSlot(100)).toThrow('Invalid slot index: 100');
    });

    it('should throw error for large negative slot index', () => {
      expect(() => saveActiveSlot(-100)).toThrow('Invalid slot index: -100');
    });

    it('should store as string representation', () => {
      saveActiveSlot(7);
      const stored = mockLocalStorage.getItem('lcxl3-active-slot');
      expect(stored).toBe('7');
      expect(typeof stored).toBe('string');
    });
  });

  describe('loadActiveSlot', () => {
    it('should return 0 when no slot is stored', () => {
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should load a valid slot index', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '5');
      const result = loadActiveSlot();
      expect(result).toBe(5);
    });

    it('should load slot index 0', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '0');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should load slot index 14', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '14');
      const result = loadActiveSlot();
      expect(result).toBe(14);
    });

    it('should return 0 for invalid JSON', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', 'not a number');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should return 0 for negative stored value', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '-1');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should return 0 for value > 14', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '15');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should return 0 for value >> 14', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '999');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should return 0 for empty string', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '');
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should return 0 for null storage', () => {
      const result = loadActiveSlot();
      expect(result).toBe(0);
    });

    it('should handle floating point strings', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '5.7');
      const result = loadActiveSlot();
      expect(result).toBe(5);
    });

    it('should handle whitespace in string', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', ' 5 ');
      const result = loadActiveSlot();
      expect(result).toBe(5);
    });
  });

  describe('saveSlotNames', () => {
    const validNames = Array.from({ length: 15 }, (_, i) => `Slot ${i + 1}`);

    it('should save valid slot names array', () => {
      saveSlotNames(validNames);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lcxl3-slot-names',
        JSON.stringify(validNames)
      );
    });

    it('should save slot names with empty strings', () => {
      const namesWithEmpty = Array.from({ length: 15 }, () => '');
      saveSlotNames(namesWithEmpty);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should save slot names with special characters', () => {
      const names = Array.from({ length: 15 }, (_, i) => `Slot "Test" ${i}`);
      saveSlotNames(names);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const stored = mockLocalStorage.setItem.mock.calls[0][1];
      expect(() => JSON.parse(stored)).not.toThrow();
    });

    it('should throw error for array with < 15 names', () => {
      const shortArray = ['Slot 1', 'Slot 2'];
      expect(() => saveSlotNames(shortArray)).toThrow('Expected 15 slot names, got 2');
    });

    it('should throw error for array with > 15 names', () => {
      const longArray = Array.from({ length: 20 }, (_, i) => `Slot ${i}`);
      expect(() => saveSlotNames(longArray)).toThrow('Expected 15 slot names, got 20');
    });

    it('should throw error for empty array', () => {
      expect(() => saveSlotNames([])).toThrow('Expected 15 slot names, got 0');
    });

    it('should throw error for array with 14 names', () => {
      const almostRight = Array.from({ length: 14 }, (_, i) => `Slot ${i}`);
      expect(() => saveSlotNames(almostRight)).toThrow('Expected 15 slot names, got 14');
    });

    it('should throw error for array with 16 names', () => {
      const tooMany = Array.from({ length: 16 }, (_, i) => `Slot ${i}`);
      expect(() => saveSlotNames(tooMany)).toThrow('Expected 15 slot names, got 16');
    });

    it('should handle names with unicode characters', () => {
      const unicodeNames = Array.from({ length: 15 }, (_, i) => `Slot ${i} 🎵🎹`);
      saveSlotNames(unicodeNames);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loadSlotNames', () => {
    const validNames = Array.from({ length: 15 }, (_, i) => `Slot ${i + 1}`);

    it('should return null when no names are stored', () => {
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should load valid slot names array', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(validNames));
      const result = loadSlotNames();
      expect(result).toEqual(validNames);
    });

    it('should load array with empty strings', () => {
      const namesWithEmpty = Array.from({ length: 15 }, () => '');
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(namesWithEmpty));
      const result = loadSlotNames();
      expect(result).toEqual(namesWithEmpty);
    });

    it('should return null for invalid JSON', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', 'invalid json {');
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for non-array value', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify({ not: 'array' }));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for array with < 15 elements', () => {
      const shortArray = ['Slot 1', 'Slot 2'];
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(shortArray));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for array with > 15 elements', () => {
      const longArray = Array.from({ length: 20 }, (_, i) => `Slot ${i}`);
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(longArray));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for empty array', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify([]));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', '');
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for string value', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify('just a string'));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for number value', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(42));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should return null for null value', () => {
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(null));
      const result = loadSlotNames();
      expect(result).toBeNull();
    });

    it('should handle names with special characters', () => {
      const specialNames = Array.from({ length: 15 }, (_, i) => `"Slot" ${i} & 'test'`);
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(specialNames));
      const result = loadSlotNames();
      expect(result).toEqual(specialNames);
    });

    it('should handle names with unicode', () => {
      const unicodeNames = Array.from({ length: 15 }, (_, i) => `Slot ${i} 🎵🎹`);
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(unicodeNames));
      const result = loadSlotNames();
      expect(result).toEqual(unicodeNames);
    });
  });

  describe('clearSlotData', () => {
    it('should clear both slot keys', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '5');
      mockLocalStorage.setItem('lcxl3-slot-names', JSON.stringify(['test']));

      clearSlotData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-active-slot');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-slot-names');
      expect(mockLocalStorage.getItem('lcxl3-active-slot')).toBeNull();
      expect(mockLocalStorage.getItem('lcxl3-slot-names')).toBeNull();
    });

    it('should not throw when localStorage is empty', () => {
      expect(() => clearSlotData()).not.toThrow();
    });

    it('should remove items even if only one exists', () => {
      mockLocalStorage.setItem('lcxl3-active-slot', '5');

      clearSlotData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-active-slot');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lcxl3-slot-names');
    });
  });

  describe('integration scenarios', () => {
    it('should save and load active slot', () => {
      saveActiveSlot(7);
      const loaded = loadActiveSlot();
      expect(loaded).toBe(7);
    });

    it('should save and load slot names', () => {
      const names = Array.from({ length: 15 }, (_, i) => `Slot ${i + 1}`);
      saveSlotNames(names);
      const loaded = loadSlotNames();
      expect(loaded).toEqual(names);
    });

    it('should handle clear and load cycle for active slot', () => {
      saveActiveSlot(10);
      clearSlotData();
      const loaded = loadActiveSlot();
      expect(loaded).toBe(0); // Default value
    });

    it('should handle clear and load cycle for slot names', () => {
      const names = Array.from({ length: 15 }, (_, i) => `Slot ${i + 1}`);
      saveSlotNames(names);
      clearSlotData();
      const loaded = loadSlotNames();
      expect(loaded).toBeNull();
    });

    it('should handle updating active slot multiple times', () => {
      saveActiveSlot(3);
      saveActiveSlot(7);
      saveActiveSlot(12);
      const loaded = loadActiveSlot();
      expect(loaded).toBe(12);
    });

    it('should handle updating slot names multiple times', () => {
      const names1 = Array.from({ length: 15 }, (_, i) => `First ${i}`);
      const names2 = Array.from({ length: 15 }, (_, i) => `Second ${i}`);
      saveSlotNames(names1);
      saveSlotNames(names2);
      const loaded = loadSlotNames();
      expect(loaded).toEqual(names2);
    });

    it('should maintain independence between active slot and names', () => {
      const names = Array.from({ length: 15 }, (_, i) => `Slot ${i + 1}`);
      saveActiveSlot(5);
      saveSlotNames(names);

      // Clear only via clearSlotData
      clearSlotData();

      expect(loadActiveSlot()).toBe(0);
      expect(loadSlotNames()).toBeNull();
    });
  });
});
