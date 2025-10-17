import { describe, it, expect } from 'vitest';
import {
  customModeToLCXL3Mode,
  lcxl3ModeToCustomMode,
  getAllLCXL3ControlIds,
  getAllMappedControlIds,
  isControlIdMapped,
  getLCXL3ControlId,
  getOurControlId,
  getControlMappingStats
} from '@/utils/modeConverter';
import type { CustomMode } from '@/types/mode';
import type { CustomMode as LCXL3CustomMode } from '@oletizi/launch-control-xl3';

/**
 * Test file for modeConverter.ts
 *
 * PURPOSE: Prevent regression of the 8→18 character bug
 * CRITICAL: Name truncation was incorrectly limited to 8 chars instead of 18
 * TARGET: 100% coverage (statements, branches, functions, lines)
 */

describe('modeConverter', () => {
  // Helper function to create a valid CustomMode
  const createCustomMode = (name: string, controls: Record<string, any> = {}): CustomMode => ({
    name,
    description: 'Test mode',
    version: '1.0.0',
    controls,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  });

  // Helper function to create a valid LCXL3CustomMode
  const createLCXL3Mode = (name: string, controls: any = {}): LCXL3CustomMode => ({
    name,
    controls,
    labels: new Map(),
    metadata: {
      name,
      description: 'Test mode',
      version: '1.0.0'
    }
  });

  describe('Suite 1: Name Truncation (Bug Prevention)', () => {
    describe('customModeToLCXL3Mode - name truncation', () => {
      it('should truncate names to exactly 18 characters', () => {
        const longName = 'ThisIsAVeryLongModeNameThatExceeds18Characters';
        const customMode = createCustomMode(longName);

        const result = customModeToLCXL3Mode(customMode);

        expect(result.name.length).toBe(18);
        expect(result.name).toBe('ThisIsAVeryLongMod');
      });

      it('should NOT truncate names of exactly 18 characters', () => {
        const exactName = 'Exactly18CharsName'; // 18 chars
        expect(exactName.length).toBe(18);

        const customMode = createCustomMode(exactName);
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe(exactName);
        expect(result.name.length).toBe(18);
      });

      it('should NOT truncate names shorter than 18 characters', () => {
        const shortName = 'ShortMode';
        const customMode = createCustomMode(shortName);

        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe(shortName);
        expect(result.name.length).toBe(9);
      });

      it('should NOT truncate 17-character names (boundary test)', () => {
        const name17 = 'SeventeenCharName'; // 17 chars
        expect(name17.length).toBe(17);

        const customMode = createCustomMode(name17);
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe(name17);
        expect(result.name.length).toBe(17);
      });

      it('should truncate 19-character names to 18 (boundary test)', () => {
        const name19 = 'NineteenCharacters!'; // 19 chars
        expect(name19.length).toBe(19);

        const customMode = createCustomMode(name19);
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name.length).toBe(18);
        expect(result.name).toBe('NineteenCharacters');
      });

      it('should NOT truncate to 8 characters (bug regression test)', () => {
        const longName = 'VeryLongModeName12345';
        const customMode = createCustomMode(longName);

        const result = customModeToLCXL3Mode(customMode);

        // Explicit check that we're NOT using 8 char limit
        expect(result.name.length).not.toBe(8);
        expect(result.name).not.toBe('VeryLong');

        // Verify correct 18 char limit
        expect(result.name.length).toBe(18);
        expect(result.name).toBe('VeryLongModeName12');
      });
    });
  });

  describe('Suite 2: Edge Cases', () => {
    describe('customModeToLCXL3Mode - edge cases', () => {
      it('should handle empty string name', () => {
        const customMode = createCustomMode('');
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe('');
        expect(result.metadata?.name).toBe('');
      });

      it('should handle single character name', () => {
        const customMode = createCustomMode('A');
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe('A');
        expect(result.name.length).toBe(1);
      });

      it('should handle whitespace only name', () => {
        const customMode = createCustomMode('   ');
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe('   ');
        expect(result.name.length).toBe(3);
      });

      it('should handle special characters in name', () => {
        const specialName = '!@#$%^&*()_+-=[]{}';
        const customMode = createCustomMode(specialName);
        const result = customModeToLCXL3Mode(customMode);

        expect(result.name).toBe(specialName);
        expect(result.name.length).toBe(18);
      });

      it('should handle unicode and emoji in name', () => {
        const unicodeName = 'Test🎵Mode音楽123';
        const customMode = createCustomMode(unicodeName);
        const result = customModeToLCXL3Mode(customMode);

        // substring works on UTF-16 code units, so result depends on encoding
        expect(result.name.length).toBeLessThanOrEqual(18);
        expect(result.name).toBeTruthy();
      });
    });

    describe('lcxl3ModeToCustomMode - edge cases', () => {
      it('should handle empty controls object', () => {
        const lcxl3Mode = createLCXL3Mode('TestMode', {});
        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.name).toBe('TestMode');
        expect(result.controls).toEqual({});
      });

      it('should handle undefined controls', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: undefined as any,
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.name).toBe('TestMode');
        expect(result.controls).toEqual({});
      });

      it('should handle controls as Map', () => {
        const controlsMap = new Map();
        controlsMap.set('SEND_A1', {
          controlId: 0x10,
          type: 'knob',
          channel: 0,
          cc: 13,
          min: 0,
          max: 127,
          behaviour: 'absolute',
          name: 'Test Knob'
        });

        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: controlsMap as any,
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.controls['knob-cc13']).toBeDefined();
        expect(result.controls['knob-cc13'].ccNumber).toBe(13);
      });

      it('should handle controls as array', () => {
        const controlsArray = [
          {
            controlId: 0x10,
            type: 'knob',
            channel: 0,
            cc: 13,
            min: 0,
            max: 127,
            behaviour: 'absolute',
            name: 'Test Knob'
          }
        ];

        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: controlsArray as any,
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.controls['knob-cc13']).toBeDefined();
        expect(result.controls['knob-cc13'].ccNumber).toBe(13);
      });
    });
  });

  describe('Suite 3: Full Mode Conversion', () => {
    describe('customModeToLCXL3Mode - full conversion', () => {
      it('should preserve non-name properties', () => {
        const customMode: CustomMode = {
          name: 'TestMode',
          description: 'Test Description',
          version: '2.0.0',
          controls: {
            'knob-cc13': {
              id: 'knob-cc13',
              type: 'knob',
              ccNumber: 13,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127,
              label: 'Volume'
            }
          },
          createdAt: '2025-10-17T00:00:00Z',
          modifiedAt: '2025-10-17T12:00:00Z'
        };

        const result = customModeToLCXL3Mode(customMode);

        expect(result.metadata?.name).toBe('TestMode');
        expect(result.metadata?.description).toBe('Test Description');
        expect(result.metadata?.version).toBe('2.0.0');
        expect(result.controls['SEND_A1']).toBeDefined();
        expect(result.controls['SEND_A1'].cc).toBe(13);
        expect(result.controls['SEND_A1'].name).toBe('Volume');
      });

      it('should truncate name while preserving other properties', () => {
        const customMode: CustomMode = {
          name: 'VeryLongModeNameThatExceeds18Characters',
          description: 'Test Description',
          version: '2.0.0',
          controls: {
            'fader-cc5': {
              id: 'fader-cc5',
              type: 'fader',
              ccNumber: 5,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127,
              label: 'Master'
            }
          },
          createdAt: '2025-10-17T00:00:00Z',
          modifiedAt: '2025-10-17T12:00:00Z'
        };

        const result = customModeToLCXL3Mode(customMode);

        // Name should be truncated
        expect(result.name.length).toBe(18);
        expect(result.name).toBe('VeryLongModeNameTh');

        // But metadata should have full name
        expect(result.metadata?.name).toBe('VeryLongModeNameThatExceeds18Characters');
        expect(result.metadata?.description).toBe('Test Description');
        expect(result.metadata?.version).toBe('2.0.0');

        // Controls should be preserved
        expect(result.controls['FADER1']).toBeDefined();
        expect(result.controls['FADER1'].cc).toBe(5);
      });
    });

    describe('lcxl3ModeToCustomMode - full conversion', () => {
      it('should convert LCXL3 mode with all control types', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'FullMode',
          controls: {
            'SEND_A1': {
              controlId: 0x10,
              type: 'knob',
              channel: 0,
              cc: 13,
              min: 0,
              max: 127,
              behaviour: 'absolute',
              name: 'Send A1'
            },
            'FADER1': {
              controlId: 0x28,
              type: 'fader',
              channel: 0,
              cc: 5,
              min: 0,
              max: 127,
              behaviour: 'absolute',
              name: 'Fader 1'
            },
            'FOCUS1': {
              controlId: 0x30,
              type: 'button',
              channel: 0,
              cc: 41,
              min: 0,
              max: 127,
              behaviour: 'absolute',
              name: 'Focus 1'
            }
          },
          labels: new Map(),
          metadata: {
            name: 'FullMode',
            description: 'Complete test mode',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.name).toBe('FullMode');
        expect(result.description).toBe('Complete test mode');
        expect(result.version).toBe('1.0.0');

        expect(result.controls['knob-cc13']).toBeDefined();
        expect(result.controls['knob-cc13'].type).toBe('knob');
        expect(result.controls['knob-cc13'].ccNumber).toBe(13);

        expect(result.controls['fader-cc5']).toBeDefined();
        expect(result.controls['fader-cc5'].type).toBe('fader');
        expect(result.controls['fader-cc5'].ccNumber).toBe(5);

        expect(result.controls['button-cc41']).toBeDefined();
        expect(result.controls['button-cc41'].type).toBe('button');
        expect(result.controls['button-cc41'].ccNumber).toBe(41);
      });

      it('should handle legacy control format (ccNumber/midiChannel)', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'LegacyMode',
          controls: [
            {
              type: 'knob',
              ccNumber: 13,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127,
              name: 'Legacy Knob'
            }
          ] as any,
          labels: new Map(),
          metadata: {
            name: 'LegacyMode',
            description: 'Legacy format',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.controls['knob-cc13']).toBeDefined();
        expect(result.controls['knob-cc13'].ccNumber).toBe(13);
        expect(result.controls['knob-cc13'].midiChannel).toBe(0);
      });

      it('should fallback to mode.name when metadata is missing', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'SimpleMode',
          controls: {},
          labels: new Map()
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        expect(result.name).toBe('SimpleMode');
        expect(result.description).toContain('Fetched from device');
        expect(result.version).toBe('1.0.0');
      });
    });
  });

  describe('Suite 4: Error Handling', () => {
    describe('lcxl3ModeToCustomMode - error handling', () => {
      it('should handle controls with missing CC number', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: [
            {
              type: 'knob',
              midiChannel: 0,
              minValue: 0,
              maxValue: 127
              // Missing ccNumber/cc
            }
          ] as any,
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        // Should skip control with missing CC
        expect(Object.keys(result.controls).length).toBe(0);
      });

      it('should handle controls with missing type', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: [
            {
              cc: 13,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127
              // Missing type
            }
          ] as any,
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        // Should skip control with missing type
        expect(Object.keys(result.controls).length).toBe(0);
      });

      it('should handle unmapped control IDs gracefully', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: {
            'UNKNOWN_CONTROL': {
              controlId: 0xFF, // Unmapped ID
              type: 'knob',
              channel: 0,
              cc: 99,
              min: 0,
              max: 127,
              behaviour: 'absolute',
              name: 'Unknown'
            }
          },
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        const result = lcxl3ModeToCustomMode(lcxl3Mode);

        // Should handle unmapped controls
        expect(result.name).toBe('TestMode');
        expect(result.controls).toBeDefined();
      });

      it('should throw error for invalid controls format', () => {
        const lcxl3Mode: LCXL3CustomMode = {
          name: 'TestMode',
          controls: 'invalid' as any, // Invalid format
          labels: new Map(),
          metadata: {
            name: 'TestMode',
            description: 'Test',
            version: '1.0.0'
          }
        };

        expect(() => lcxl3ModeToCustomMode(lcxl3Mode)).toThrow('Invalid controls format');
      });
    });

    describe('customModeToLCXL3Mode - error handling', () => {
      it('should handle controls with unmapped IDs', () => {
        const customMode: CustomMode = {
          name: 'TestMode',
          description: 'Test',
          version: '1.0.0',
          controls: {
            'unknown-control': {
              id: 'unknown-control',
              type: 'knob',
              ccNumber: 99,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127
            }
          },
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        };

        const result = customModeToLCXL3Mode(customMode);

        // Should skip unmapped controls
        expect(Object.keys(result.controls).length).toBe(0);
      });

      it('should handle controls without labels', () => {
        const customMode: CustomMode = {
          name: 'TestMode',
          description: 'Test',
          version: '1.0.0',
          controls: {
            'knob-cc13': {
              id: 'knob-cc13',
              type: 'knob',
              ccNumber: 13,
              midiChannel: 0,
              minValue: 0,
              maxValue: 127
              // No label
            }
          },
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        };

        const result = customModeToLCXL3Mode(customMode);

        expect(result.controls['SEND_A1']).toBeDefined();
        expect(result.controls['SEND_A1'].name).toBeUndefined();
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getAllLCXL3ControlIds', () => {
      it('should return all LCXL3 control hex IDs', () => {
        const ids = getAllLCXL3ControlIds();

        expect(Array.isArray(ids)).toBe(true);
        expect(ids.length).toBeGreaterThan(0);
        expect(ids).toContain(0x10); // SEND_A1
        expect(ids).toContain(0x28); // FADER1
        expect(ids).toContain(0x30); // FOCUS1
      });
    });

    describe('getAllMappedControlIds', () => {
      it('should return all mapped control IDs', () => {
        const ids = getAllMappedControlIds();

        expect(Array.isArray(ids)).toBe(true);
        expect(ids.length).toBeGreaterThan(0);
        expect(ids).toContain('knob-cc13');
        expect(ids).toContain('fader-cc5');
        expect(ids).toContain('button-cc41');
      });
    });

    describe('isControlIdMapped', () => {
      it('should return true for mapped control IDs', () => {
        expect(isControlIdMapped('knob-cc13')).toBe(true);
        expect(isControlIdMapped('fader-cc5')).toBe(true);
        expect(isControlIdMapped('button-cc41')).toBe(true);
      });

      it('should return false for unmapped control IDs', () => {
        expect(isControlIdMapped('unknown-control')).toBe(false);
        expect(isControlIdMapped('invalid')).toBe(false);
        expect(isControlIdMapped('')).toBe(false);
      });
    });

    describe('getLCXL3ControlId', () => {
      it('should return LCXL3 control ID for mapped controls', () => {
        expect(getLCXL3ControlId('knob-cc13')).toBe(0x10);
        expect(getLCXL3ControlId('fader-cc5')).toBe(0x28);
        expect(getLCXL3ControlId('button-cc41')).toBe(0x30);
      });

      it('should return null for unmapped controls', () => {
        expect(getLCXL3ControlId('unknown-control')).toBeNull();
        expect(getLCXL3ControlId('invalid')).toBeNull();
      });
    });

    describe('getOurControlId', () => {
      it('should return our control ID for LCXL3 control IDs', () => {
        expect(getOurControlId(0x10)).toBe('knob-cc13');
        expect(getOurControlId(0x28)).toBe('fader-cc5');
        expect(getOurControlId(0x30)).toBe('button-cc41');
      });

      it('should return null for unmapped LCXL3 control IDs', () => {
        expect(getOurControlId(0xFF)).toBeNull();
        expect(getOurControlId(999)).toBeNull();
      });
    });

    describe('getControlMappingStats', () => {
      it('should return accurate control mapping statistics', () => {
        const stats = getControlMappingStats();

        expect(stats.total).toBeGreaterThan(0);
        expect(stats.knobs).toBe(24); // 3 rows of 8 knobs
        expect(stats.faders).toBe(8);
        expect(stats.buttons).toBe(16); // 2 rows of 8 buttons
        expect(stats.expectedTotal).toBe(48);
        expect(stats.total).toBe(stats.expectedTotal);
      });
    });
  });

  describe('Round-trip Conversion', () => {
    it('should preserve data through round-trip conversion', () => {
      const originalMode: CustomMode = {
        name: 'RoundTripTest',
        description: 'Test round-trip conversion',
        version: '1.0.0',
        controls: {
          'knob-cc13': {
            id: 'knob-cc13',
            type: 'knob',
            ccNumber: 13,
            midiChannel: 0,
            minValue: 0,
            maxValue: 127,
            label: 'Volume'
          },
          'fader-cc5': {
            id: 'fader-cc5',
            type: 'fader',
            ccNumber: 5,
            midiChannel: 0,
            minValue: 0,
            maxValue: 127,
            label: 'Master'
          }
        },
        createdAt: '2025-10-17T00:00:00Z',
        modifiedAt: '2025-10-17T12:00:00Z'
      };

      // Convert to LCXL3 format
      const lcxl3Mode = customModeToLCXL3Mode(originalMode);

      // Convert back to custom format
      const backToCustom = lcxl3ModeToCustomMode(lcxl3Mode);

      // Verify key data is preserved
      expect(backToCustom.name).toBe(originalMode.name);
      expect(backToCustom.description).toBe(originalMode.description);
      expect(backToCustom.version).toBe(originalMode.version);

      expect(backToCustom.controls['knob-cc13']).toBeDefined();
      expect(backToCustom.controls['knob-cc13'].ccNumber).toBe(13);
      expect(backToCustom.controls['knob-cc13'].label).toBe('Volume');

      expect(backToCustom.controls['fader-cc5']).toBeDefined();
      expect(backToCustom.controls['fader-cc5'].ccNumber).toBe(5);
      expect(backToCustom.controls['fader-cc5'].label).toBe('Master');
    });
  });
});
