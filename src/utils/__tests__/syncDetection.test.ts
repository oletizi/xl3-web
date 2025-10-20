import { describe, it, expect, beforeEach } from 'vitest';
import {
  modesAreEqual,
  checkSlotSync,
  SyncTracker,
  type SyncStatus,
} from '@/utils/syncDetection';
import type { CustomMode } from '@/types/mode';
import type { LCXL3CustomMode } from '@/utils/modeConverter';

describe('syncDetection', () => {
  const createTestMode = (name = 'Test Mode'): CustomMode => ({
    name,
    description: 'Test description',
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
      'fader-cc5': {
        id: 'fader-cc5',
        type: 'fader',
        ccNumber: 5,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
        label: 'Test Fader',
      },
    },
    createdAt: '2025-01-01T00:00:00Z',
    modifiedAt: '2025-01-01T00:00:00Z',
  });

  const createLCXL3Mode = (): LCXL3CustomMode => ({
    name: 'Device Mode',
    controls: {
      'knob-cc13': {
        type: 'knob',
        ccNumber: 13,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
      },
      'fader-cc5': {
        type: 'fader',
        ccNumber: 5,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
      },
    },
  });

  describe('modesAreEqual', () => {
    it('should return true for identical modes', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should return false for modes with different control CC numbers', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['knob-cc13'].ccNumber = 14;
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should return false for modes with different control MIDI channels', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['knob-cc13'].midiChannel = 2;
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should return false for modes with different min values', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['knob-cc13'].minValue = 10;
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should return false for modes with different max values', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['knob-cc13'].maxValue = 100;
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should ignore name differences', () => {
      const mode1 = createTestMode('Mode A');
      const mode2 = createTestMode('Mode B');
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should ignore description differences', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.description = 'Different description';
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should ignore version differences', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.version = '2.0.0';
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should ignore createdAt differences', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.createdAt = '2025-01-02T00:00:00Z';
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should ignore modifiedAt differences', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.modifiedAt = '2025-01-02T00:00:00Z';
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should ignore label differences', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['knob-cc13'].label = 'Different Label';
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should return false for modes with different control keys', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      delete mode2.controls['fader-cc5'];
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should return false for modes with additional controls', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      mode2.controls['button-cc37'] = {
        id: 'button-cc37',
        type: 'button',
        ccNumber: 37,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
      };
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should handle modes with empty controls', () => {
      const mode1 = { ...createTestMode(), controls: {} };
      const mode2 = { ...createTestMode(), controls: {} };
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should return false when one mode has empty controls', () => {
      const mode1 = createTestMode();
      const mode2 = { ...createTestMode(), controls: {} };
      expect(modesAreEqual(mode1, mode2)).toBe(false);
    });

    it('should handle modes with many controls', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();

      // Add multiple controls
      for (let i = 14; i <= 20; i++) {
        const control = {
          id: `knob-cc${i}`,
          type: 'knob' as const,
          ccNumber: i,
          midiChannel: 1,
          minValue: 0,
          maxValue: 127,
        };
        mode1.controls[`knob-cc${i}`] = control;
        mode2.controls[`knob-cc${i}`] = control;
      }

      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should handle controls in different order', () => {
      const mode1 = createTestMode();
      const mode2: CustomMode = {
        ...createTestMode(),
        controls: {
          'fader-cc5': mode1.controls['fader-cc5'],
          'knob-cc13': mode1.controls['knob-cc13'],
        },
      };
      expect(modesAreEqual(mode1, mode2)).toBe(true);
    });

    it('should generate consistent hashes for same data', () => {
      const mode1 = createTestMode();
      const mode2 = createTestMode();
      const mode3 = createTestMode();

      // Call multiple times to ensure consistency
      expect(modesAreEqual(mode1, mode2)).toBe(true);
      expect(modesAreEqual(mode2, mode3)).toBe(true);
      expect(modesAreEqual(mode1, mode3)).toBe(true);
    });
  });

  describe('checkSlotSync', () => {
    it('should return true for synced modes', async () => {
      const editBuffer = createTestMode();
      const deviceMode = createLCXL3Mode();

      // Adjust editBuffer to match device mode structure
      editBuffer.name = 'Device Mode';

      const result = await checkSlotSync(editBuffer, deviceMode);
      expect(result).toBe(true);
    });

    it('should return false for different modes', async () => {
      const editBuffer = createTestMode();
      const deviceMode = createLCXL3Mode();

      // Change a control
      editBuffer.controls['knob-cc13'].ccNumber = 14;

      const result = await checkSlotSync(editBuffer, deviceMode);
      expect(result).toBe(false);
    });

    it('should handle async operation', async () => {
      const editBuffer = createTestMode();
      const deviceMode = createLCXL3Mode();
      editBuffer.name = 'Device Mode';

      const promise = checkSlotSync(editBuffer, deviceMode);
      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;
      expect(typeof result).toBe('boolean');
    });

    it('should return false when controls differ', async () => {
      const editBuffer = createTestMode();
      const deviceMode = createLCXL3Mode();

      editBuffer.controls['knob-cc13'].midiChannel = 2;

      const result = await checkSlotSync(editBuffer, deviceMode);
      expect(result).toBe(false);
    });

    it('should return false when min/max differ', async () => {
      const editBuffer = createTestMode();
      const deviceMode = createLCXL3Mode();

      editBuffer.controls['knob-cc13'].minValue = 10;

      const result = await checkSlotSync(editBuffer, deviceMode);
      expect(result).toBe(false);
    });
  });

  describe('SyncTracker', () => {
    let tracker: SyncTracker;

    beforeEach(() => {
      tracker = new SyncTracker();
    });

    describe('constructor', () => {
      it('should create a new tracker with unknown status', () => {
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });
    });

    describe('markFetched', () => {
      it('should set status to synced after fetch', () => {
        const mode = createTestMode();
        tracker.markFetched(mode);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should update both device and edit buffer hashes', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        // Marking with same mode should remain synced
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should handle multiple fetches', () => {
        const mode1 = createTestMode('Mode 1');
        const mode2 = createTestMode('Mode 2');

        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        tracker.markFetched(mode2);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });
    });

    describe('markSent', () => {
      it('should set status to synced after send', () => {
        const mode = createTestMode();
        tracker.markSent(mode);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should handle multiple sends', () => {
        const mode1 = createTestMode('Mode 1');
        const mode2 = createTestMode('Mode 2');

        tracker.markSent(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        tracker.markSent(mode2);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });
    });

    describe('markEdited', () => {
      it('should set status to modified after edit', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);

        expect(tracker.getOptimisticStatus()).toBe('modified');
      });

      it('should handle edit without prior fetch', () => {
        const mode = createTestMode();
        tracker.markEdited(mode);
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });

      it('should detect when edit returns to synced state', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);
        expect(tracker.getOptimisticStatus()).toBe('modified');

        // Edit back to original
        tracker.markEdited(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });
    });

    describe('getOptimisticStatus', () => {
      it('should return unknown when no operations', () => {
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });

      it('should return synced after fetch', () => {
        const mode = createTestMode();
        tracker.markFetched(mode);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should return synced after send', () => {
        const mode = createTestMode();
        tracker.markSent(mode);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should return modified after edit', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);

        expect(tracker.getOptimisticStatus()).toBe('modified');
      });

      it('should return unknown if only edit buffer is set', () => {
        const mode = createTestMode();
        tracker.markEdited(mode);
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });
    });

    describe('reset', () => {
      it('should reset to unknown status', () => {
        const mode = createTestMode();
        tracker.markFetched(mode);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        tracker.reset();
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });

      it('should clear all tracked state', () => {
        const mode = createTestMode();
        tracker.markFetched(mode);
        tracker.markEdited(mode);

        tracker.reset();
        expect(tracker.getOptimisticStatus()).toBe('unknown');
      });

      it('should allow fresh start after reset', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);
        tracker.reset();

        const mode2 = createTestMode();
        tracker.markFetched(mode2);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });
    });

    describe('integration scenarios', () => {
      it('should handle fetch -> edit -> send workflow', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);
        expect(tracker.getOptimisticStatus()).toBe('modified');

        tracker.markSent(mode2);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should handle fetch -> edit -> fetch (discard changes)', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);
        expect(tracker.getOptimisticStatus()).toBe('modified');

        // Fetch original again
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });

      it('should handle multiple edits', () => {
        const mode1 = createTestMode();
        tracker.markFetched(mode1);

        const mode2 = createTestMode();
        mode2.controls['knob-cc13'].ccNumber = 14;
        tracker.markEdited(mode2);
        expect(tracker.getOptimisticStatus()).toBe('modified');

        const mode3 = createTestMode();
        mode3.controls['knob-cc13'].ccNumber = 15;
        tracker.markEdited(mode3);
        expect(tracker.getOptimisticStatus()).toBe('modified');
      });

      it('should handle slot switching workflow', () => {
        const mode1 = createTestMode('Slot 0');
        tracker.markFetched(mode1);
        expect(tracker.getOptimisticStatus()).toBe('synced');

        // Switch slots
        tracker.reset();
        expect(tracker.getOptimisticStatus()).toBe('unknown');

        const mode2 = createTestMode('Slot 1');
        tracker.markFetched(mode2);
        expect(tracker.getOptimisticStatus()).toBe('synced');
      });
    });
  });
});
