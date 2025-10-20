import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useModeBuilder } from '@/hooks/useModeBuilder';
import { Control } from '@/types/controls';
import { CustomMode } from '@/types/mode';

describe('useModeBuilder', () => {
  let mockKnobControl: Control;
  let mockFaderControl: Control;
  let mockButtonControl: Control;

  beforeEach(() => {
    mockKnobControl = {
      id: 'knob-1-2',
      type: 'knob',
      label: 'Knob 1-2',
      ccNumber: 13,
      channel: 0,
      x: 100,
      y: 50,
    };

    mockFaderControl = {
      id: 'fader-3',
      type: 'fader',
      label: 'Fader 3',
      ccNumber: 77,
      channel: 0,
      x: 200,
      y: 150,
    };

    mockButtonControl = {
      id: 'fader-btn-1',
      type: 'button',
      label: 'Focus 1',
      ccNumber: 41,
      channel: 0,
      x: 150,
      y: 100,
    };
  });

  describe('initialization', () => {
    it('should initialize with default mode', () => {
      const { result } = renderHook(() => useModeBuilder());

      expect(result.current.mode.name).toBe('Untitled Mode');
      expect(result.current.mode.description).toBe('');
      expect(result.current.mode.controls).toEqual({});
      expect(result.current.isDirty).toBe(false);
    });

    it('should initialize with provided initial mode', () => {
      const initialMode: CustomMode = {
        name: 'Custom Mode',
        description: 'Test description',
        version: '1.0.0',
        controls: {
          SEND_A1: {
            id: 'SEND_A1',
            type: 'knob',
            ccNumber: 13,
            midiChannel: 0,
            minValue: 0,
            maxValue: 127,
          },
        },
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      const { result } = renderHook(() =>
        useModeBuilder({ initialMode })
      );

      expect(result.current.mode.name).toBe('Custom Mode');
      expect(result.current.mode.controls).toHaveProperty('SEND_A1');
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('control mapping', () => {
    it('should map knob control ID to mode key', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockKnobControl, {
          min: 0,
          max: 100,
        });
      });

      // knob-1-2 should map to SEND_A2 (row 1, col 2)
      expect(result.current.mode.controls).toHaveProperty('SEND_A2');
    });

    it('should map fader control ID to mode key', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockFaderControl, {
          min: 0,
          max: 127,
        });
      });

      // fader-3 should map to FADER3
      expect(result.current.mode.controls).toHaveProperty('FADER3');
    });

    it('should map button control ID to mode key', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockButtonControl, {
          min: 0,
          max: 127,
        });
      });

      // fader-btn-1 should map to FOCUS1
      expect(result.current.mode.controls).toHaveProperty('FOCUS1');
    });

    it('should handle all knob rows and columns', () => {
      const { result } = renderHook(() => useModeBuilder());

      // Test row 1 (SEND_A)
      const knob11: Control = { ...mockKnobControl, id: 'knob-1-1' };
      act(() => {
        result.current.updateControl(knob11, { min: 0, max: 127 });
      });
      expect(result.current.mode.controls).toHaveProperty('SEND_A1');

      // Test row 2 (SEND_B)
      const knob21: Control = { ...mockKnobControl, id: 'knob-2-1' };
      act(() => {
        result.current.updateControl(knob21, { min: 0, max: 127 });
      });
      expect(result.current.mode.controls).toHaveProperty('SEND_B1');

      // Test row 3 (PAN)
      const knob31: Control = { ...mockKnobControl, id: 'knob-3-1' };
      act(() => {
        result.current.updateControl(knob31, { min: 0, max: 127 });
      });
      expect(result.current.mode.controls).toHaveProperty('PAN1');
    });

    it('should fall back to original ID for unmapped controls', () => {
      const { result } = renderHook(() => useModeBuilder());

      const unknownControl: Control = {
        ...mockKnobControl,
        id: 'unknown-control-99',
      };

      act(() => {
        result.current.updateControl(unknownControl, {
          min: 0,
          max: 127,
        });
      });

      expect(result.current.mode.controls).toHaveProperty('unknown-control-99');
    });
  });

  describe('updateControl', () => {
    it('should update control with provided values', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockKnobControl, {
          min: 10,
          max: 100,
          label: 'Custom Label',
        });
      });

      const mapping = result.current.mode.controls['SEND_A2'];
      expect(mapping.min).toBe(10);
      expect(mapping.max).toBe(100);
      expect(mapping.label).toBe('Custom Label');
    });

    it('should set isDirty to true after update', () => {
      const { result } = renderHook(() => useModeBuilder());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.updateControl(mockKnobControl, {
          min: 50,
        });
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should create control with default values if not exists', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockFaderControl, {
          min: 20,
        });
      });

      const mapping = result.current.mode.controls['FADER3'];
      expect(mapping.type).toBe('fader');
      expect(mapping.cc).toBe(mockFaderControl.ccNumber);
      expect(mapping.channel).toBe(mockFaderControl.channel);
      expect(mapping.min).toBe(20);
      expect(mapping.max).toBe(127); // default
      expect(mapping.behaviour).toBe('absolute');
    });

    it('should merge updates with existing control', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockKnobControl, {
          min: 10,
          max: 50,
        });
      });

      act(() => {
        result.current.updateControl(mockKnobControl, {
          label: 'Updated Label',
        });
      });

      const mapping = result.current.mode.controls['SEND_A2'];
      expect(mapping.min).toBe(10);
      expect(mapping.max).toBe(50);
      expect(mapping.label).toBe('Updated Label');
    });
  });

  describe('getControlMapping', () => {
    it('should return control mapping if exists', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockKnobControl, {
          min: 5,
          max: 95,
        });
      });

      const mapping = result.current.getControlMapping(mockKnobControl);

      expect(mapping).not.toBeNull();
      expect(mapping?.min).toBe(5);
      expect(mapping?.max).toBe(95);
    });

    it('should return null if control mapping does not exist', () => {
      const { result } = renderHook(() => useModeBuilder());

      const mapping = result.current.getControlMapping(mockKnobControl);

      expect(mapping).toBeNull();
    });
  });

  describe('updateModeName', () => {
    it('should update mode name', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('New Mode Name');
      });

      expect(result.current.mode.name).toBe('New Mode Name');
    });

    it('should set isDirty to true', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('Updated Name');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('updateModeDescription', () => {
    it('should update mode description', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeDescription('New description');
      });

      expect(result.current.mode.description).toBe('New description');
    });

    it('should set isDirty to true', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeDescription('Updated description');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('resetMode', () => {
    it('should reset mode to default values', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('Custom Name');
        result.current.updateModeDescription('Custom Description');
        result.current.updateControl(mockKnobControl, { min: 10 });
      });

      expect(result.current.mode.name).toBe('Custom Name');

      act(() => {
        result.current.resetMode();
      });

      expect(result.current.mode.name).toBe('Untitled Mode');
      expect(result.current.mode.description).toBe('');
      expect(result.current.mode.controls).toEqual({});
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('exportMode', () => {
    it('should export mode as JSON string', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('Export Test');
        result.current.updateControl(mockKnobControl, {
          min: 0,
          max: 127,
        });
      });

      const exported = result.current.exportMode();
      const parsed = JSON.parse(exported);

      expect(parsed.name).toBe('Export Test');
      expect(parsed.controls).toHaveProperty('SEND_A2');
    });

    it('should format JSON with indentation', () => {
      const { result } = renderHook(() => useModeBuilder());

      const exported = result.current.exportMode();

      // Check that it's formatted (contains newlines and spaces)
      expect(exported).toContain('\n');
      expect(exported).toContain('  ');
    });
  });

  describe('importMode', () => {
    it('should import valid JSON mode', () => {
      const { result } = renderHook(() => useModeBuilder());

      const modeJson = JSON.stringify({
        name: 'Imported Mode',
        description: 'Imported description',
        controls: {
          FADER1: {
            id: 'FADER1',
            type: 'fader',
            ccNumber: 77,
            midiChannel: 0,
            minValue: 0,
            maxValue: 127,
          },
        },
      });

      let success: boolean = false;
      act(() => {
        success = result.current.importMode(modeJson);
      });

      expect(success).toBe(true);
      expect(result.current.mode.name).toBe('Imported Mode');
      expect(result.current.mode.controls).toHaveProperty('FADER1');
      expect(result.current.isDirty).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const { result } = renderHook(() => useModeBuilder());

      let success: boolean = true;
      act(() => {
        success = result.current.importMode('invalid json{{{');
      });

      expect(success).toBe(false);
    });

    it('should reject JSON without name field', () => {
      const { result } = renderHook(() => useModeBuilder());

      const invalidJson = JSON.stringify({
        description: 'No name field',
        controls: {},
      });

      let success: boolean = true;
      act(() => {
        success = result.current.importMode(invalidJson);
      });

      expect(success).toBe(false);
    });

    it('should reject JSON without controls field', () => {
      const { result } = renderHook(() => useModeBuilder());

      const invalidJson = JSON.stringify({
        name: 'No controls field',
        description: 'Missing controls',
      });

      let success: boolean = true;
      act(() => {
        success = result.current.importMode(invalidJson);
      });

      expect(success).toBe(false);
    });
  });

  describe('loadMode', () => {
    it('should load new mode', () => {
      const { result } = renderHook(() => useModeBuilder());

      const newMode: CustomMode = {
        name: 'Loaded Mode',
        description: 'Loaded description',
        version: '1.0.0',
        controls: {},
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.loadMode(newMode);
      });

      expect(result.current.mode.name).toBe('Loaded Mode');
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset isDirty flag', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('Test');
      });

      expect(result.current.isDirty).toBe(true);

      const newMode: CustomMode = {
        name: 'New Mode',
        description: '',
        version: '1.0.0',
        controls: {},
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.loadMode(newMode);
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('markClean', () => {
    it('should set isDirty to false', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateModeName('Test');
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.markClean();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple control updates', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockKnobControl, { min: 10 });
        result.current.updateControl(mockFaderControl, { min: 20 });
        result.current.updateControl(mockButtonControl, { min: 30 });
      });

      expect(Object.keys(result.current.mode.controls)).toHaveLength(3);
      expect(result.current.mode.controls['SEND_A2'].min).toBe(10);
      expect(result.current.mode.controls['FADER3'].min).toBe(20);
      expect(result.current.mode.controls['FOCUS1'].min).toBe(30);
    });

    it('should handle knob at boundary columns', () => {
      const { result } = renderHook(() => useModeBuilder());

      const knob18: Control = { ...mockKnobControl, id: 'knob-1-8' };
      act(() => {
        result.current.updateControl(knob18, { min: 0, max: 127 });
      });

      expect(result.current.mode.controls).toHaveProperty('SEND_A8');
    });

    it('should preserve control type from Control object', () => {
      const { result } = renderHook(() => useModeBuilder());

      act(() => {
        result.current.updateControl(mockFaderControl, {});
      });

      const mapping = result.current.mode.controls['FADER3'];
      expect(mapping.type).toBe('fader');
      expect(mapping.cc).toBe(mockFaderControl.ccNumber);
      expect(mapping.channel).toBe(mockFaderControl.channel);
    });
  });
});
