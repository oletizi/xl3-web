import { describe, it, expect } from 'vitest';
import {
  getControlInfo,
  getAllControls,
  initializeDefaultControls,
  type ControlInfo,
} from '@/utils/controlMetadata';

describe('controlMetadata', () => {
  describe('getControlInfo', () => {
    describe('valid knob controls', () => {
      it('should parse knob-cc13', () => {
        const result = getControlInfo('knob-cc13');
        expect(result).toEqual({
          id: 'knob-cc13',
          cc: 13,
          type: 'knob',
          defaultLabel: 'Knob 13',
        });
      });

      it('should parse knob-cc20', () => {
        const result = getControlInfo('knob-cc20');
        expect(result).toEqual({
          id: 'knob-cc20',
          cc: 20,
          type: 'knob',
          defaultLabel: 'Knob 20',
        });
      });

      it('should parse knob-cc53', () => {
        const result = getControlInfo('knob-cc53');
        expect(result).toEqual({
          id: 'knob-cc53',
          cc: 53,
          type: 'knob',
          defaultLabel: 'Knob 53',
        });
      });

      it('should parse knob-cc22', () => {
        const result = getControlInfo('knob-cc22');
        expect(result).toEqual({
          id: 'knob-cc22',
          cc: 22,
          type: 'knob',
          defaultLabel: 'Knob 22',
        });
      });

      it('should parse knob-cc36', () => {
        const result = getControlInfo('knob-cc36');
        expect(result).toEqual({
          id: 'knob-cc36',
          cc: 36,
          type: 'knob',
          defaultLabel: 'Knob 36',
        });
      });
    });

    describe('valid fader controls', () => {
      it('should parse fader-cc5', () => {
        const result = getControlInfo('fader-cc5');
        expect(result).toEqual({
          id: 'fader-cc5',
          cc: 5,
          type: 'fader',
          defaultLabel: 'Fader 5',
        });
      });

      it('should parse fader-cc12', () => {
        const result = getControlInfo('fader-cc12');
        expect(result).toEqual({
          id: 'fader-cc12',
          cc: 12,
          type: 'fader',
          defaultLabel: 'Fader 12',
        });
      });

      it('should parse fader-cc8', () => {
        const result = getControlInfo('fader-cc8');
        expect(result).toEqual({
          id: 'fader-cc8',
          cc: 8,
          type: 'fader',
          defaultLabel: 'Fader 8',
        });
      });
    });

    describe('valid button controls', () => {
      it('should parse button-cc37', () => {
        const result = getControlInfo('button-cc37');
        expect(result).toEqual({
          id: 'button-cc37',
          cc: 37,
          type: 'button',
          defaultLabel: 'Button 37',
        });
      });

      it('should parse button-cc52', () => {
        const result = getControlInfo('button-cc52');
        expect(result).toEqual({
          id: 'button-cc52',
          cc: 52,
          type: 'button',
          defaultLabel: 'Button 52',
        });
      });

      it('should parse button-cc45', () => {
        const result = getControlInfo('button-cc45');
        expect(result).toEqual({
          id: 'button-cc45',
          cc: 45,
          type: 'button',
          defaultLabel: 'Button 45',
        });
      });
    });

    describe('invalid formats', () => {
      it('should return null for invalid format (no prefix)', () => {
        const result = getControlInfo('cc13');
        expect(result).toBeNull();
      });

      it('should return null for invalid format (wrong separator)', () => {
        const result = getControlInfo('knob_cc13');
        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        const result = getControlInfo('');
        expect(result).toBeNull();
      });

      it('should return null for invalid type', () => {
        const result = getControlInfo('slider-cc13');
        expect(result).toBeNull();
      });

      it('should return null for missing cc number', () => {
        const result = getControlInfo('knob-cc');
        expect(result).toBeNull();
      });

      it('should return null for non-numeric cc', () => {
        const result = getControlInfo('knob-ccABC');
        expect(result).toBeNull();
      });

      it('should return null for floating point cc', () => {
        const result = getControlInfo('knob-cc13.5');
        expect(result).toBeNull();
      });
    });

    describe('out of range CC numbers', () => {
      it('should return null for negative CC', () => {
        const result = getControlInfo('knob-cc-1');
        expect(result).toBeNull();
      });

      it('should return null for CC > 127', () => {
        const result = getControlInfo('knob-cc128');
        expect(result).toBeNull();
      });

      it('should return null for CC 0 (not in valid ranges)', () => {
        const result = getControlInfo('knob-cc0');
        expect(result).toBeNull();
      });

      it('should return null for knob with fader CC range', () => {
        const result = getControlInfo('knob-cc7');
        expect(result).toBeNull();
      });

      it('should return null for fader with knob CC range', () => {
        const result = getControlInfo('fader-cc13');
        expect(result).toBeNull();
      });

      it('should return null for button with knob CC range', () => {
        const result = getControlInfo('button-cc13');
        expect(result).toBeNull();
      });

      it('should return null for knob with button CC range', () => {
        const result = getControlInfo('knob-cc40');
        expect(result).toBeNull();
      });

      it('should return null for fader with button CC range', () => {
        const result = getControlInfo('fader-cc40');
        expect(result).toBeNull();
      });

      it('should return null for button with fader CC range', () => {
        const result = getControlInfo('button-cc8');
        expect(result).toBeNull();
      });

      it('should return null for knob-cc21 (gap in range)', () => {
        const result = getControlInfo('knob-cc21');
        expect(result).toBeNull();
      });

      it('should return null for fader-cc4 (below range)', () => {
        const result = getControlInfo('fader-cc4');
        expect(result).toBeNull();
      });

      it('should return null for fader-cc13 (above range)', () => {
        const result = getControlInfo('fader-cc13');
        expect(result).toBeNull();
      });

      it('should return null for button-cc36 (below range)', () => {
        const result = getControlInfo('button-cc36');
        expect(result).toBeNull();
      });

      it('should return null for button-cc53 (above range)', () => {
        const result = getControlInfo('button-cc53');
        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle uppercase type', () => {
        const result = getControlInfo('KNOB-cc13');
        expect(result).toBeNull(); // Case sensitive
      });

      it('should handle whitespace', () => {
        const result = getControlInfo(' knob-cc13 ');
        expect(result).toBeNull();
      });

      it('should handle extra dashes', () => {
        const result = getControlInfo('knob--cc13');
        expect(result).toBeNull();
      });
    });
  });

  describe('getAllControls', () => {
    it('should return exactly 48 controls', () => {
      const controls = getAllControls();
      expect(controls).toHaveLength(48);
    });

    it('should return 24 knobs', () => {
      const controls = getAllControls();
      const knobs = controls.filter(c => c.type === 'knob');
      expect(knobs).toHaveLength(24);
    });

    it('should return 8 faders', () => {
      const controls = getAllControls();
      const faders = controls.filter(c => c.type === 'fader');
      expect(faders).toHaveLength(8);
    });

    it('should return 16 buttons', () => {
      const controls = getAllControls();
      const buttons = controls.filter(c => c.type === 'button');
      expect(buttons).toHaveLength(16);
    });

    it('should include knobs CC 13-20', () => {
      const controls = getAllControls();
      for (let cc = 13; cc <= 20; cc++) {
        const knob = controls.find(c => c.cc === cc && c.type === 'knob');
        expect(knob).toBeDefined();
        expect(knob?.id).toBe(`knob-cc${cc}`);
      }
    });

    it('should include knob CC 53', () => {
      const controls = getAllControls();
      const knob53 = controls.find(c => c.cc === 53 && c.type === 'knob');
      expect(knob53).toBeDefined();
      expect(knob53?.id).toBe('knob-cc53');
    });

    it('should include knobs CC 22-36', () => {
      const controls = getAllControls();
      for (let cc = 22; cc <= 36; cc++) {
        const knob = controls.find(c => c.cc === cc && c.type === 'knob');
        expect(knob).toBeDefined();
        expect(knob?.id).toBe(`knob-cc${cc}`);
      }
    });

    it('should include faders CC 5-12', () => {
      const controls = getAllControls();
      for (let cc = 5; cc <= 12; cc++) {
        const fader = controls.find(c => c.cc === cc && c.type === 'fader');
        expect(fader).toBeDefined();
        expect(fader?.id).toBe(`fader-cc${cc}`);
      }
    });

    it('should include buttons CC 37-52', () => {
      const controls = getAllControls();
      for (let cc = 37; cc <= 52; cc++) {
        const button = controls.find(c => c.cc === cc && c.type === 'button');
        expect(button).toBeDefined();
        expect(button?.id).toBe(`button-cc${cc}`);
      }
    });

    it('should have proper default labels', () => {
      const controls = getAllControls();
      controls.forEach(control => {
        expect(control.defaultLabel).toMatch(
          new RegExp(`^(Knob|Fader|Button) ${control.cc}$`)
        );
      });
    });

    it('should have unique IDs', () => {
      const controls = getAllControls();
      const ids = controls.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(48);
    });

    it('should have unique CC numbers within type', () => {
      const controls = getAllControls();
      const knobCCs = controls.filter(c => c.type === 'knob').map(c => c.cc);
      const faderCCs = controls.filter(c => c.type === 'fader').map(c => c.cc);
      const buttonCCs = controls.filter(c => c.type === 'button').map(c => c.cc);

      expect(new Set(knobCCs).size).toBe(24);
      expect(new Set(faderCCs).size).toBe(8);
      expect(new Set(buttonCCs).size).toBe(16);
    });

    it('should return consistent results on multiple calls', () => {
      const controls1 = getAllControls();
      const controls2 = getAllControls();
      expect(controls1).toEqual(controls2);
    });

    it('should have valid structure for each control', () => {
      const controls = getAllControls();
      controls.forEach(control => {
        expect(control).toHaveProperty('id');
        expect(control).toHaveProperty('cc');
        expect(control).toHaveProperty('type');
        expect(control).toHaveProperty('defaultLabel');
        expect(typeof control.id).toBe('string');
        expect(typeof control.cc).toBe('number');
        expect(['knob', 'fader', 'button']).toContain(control.type);
        expect(typeof control.defaultLabel).toBe('string');
      });
    });
  });

  describe('initializeDefaultControls', () => {
    it('should return exactly 48 control mappings', () => {
      const mappings = initializeDefaultControls();
      expect(Object.keys(mappings)).toHaveLength(48);
    });

    it('should include all control IDs from getAllControls', () => {
      const mappings = initializeDefaultControls();
      const controls = getAllControls();

      controls.forEach(control => {
        expect(mappings).toHaveProperty(control.id);
      });
    });

    it('should create proper ControlMapping structure', () => {
      const mappings = initializeDefaultControls();

      Object.entries(mappings).forEach(([key, mapping]) => {
        expect(mapping.id).toBe(key);
        expect(mapping).toHaveProperty('type');
        expect(mapping).toHaveProperty('ccNumber');
        expect(mapping).toHaveProperty('midiChannel');
        expect(mapping).toHaveProperty('minValue');
        expect(mapping).toHaveProperty('maxValue');
        expect(mapping).toHaveProperty('label');
      });
    });

    it('should set default MIDI channel to 1', () => {
      const mappings = initializeDefaultControls();

      Object.values(mappings).forEach(mapping => {
        expect(mapping.midiChannel).toBe(1);
      });
    });

    it('should set default min value to 0', () => {
      const mappings = initializeDefaultControls();

      Object.values(mappings).forEach(mapping => {
        expect(mapping.minValue).toBe(0);
      });
    });

    it('should set default max value to 127', () => {
      const mappings = initializeDefaultControls();

      Object.values(mappings).forEach(mapping => {
        expect(mapping.maxValue).toBe(127);
      });
    });

    it('should set label from default label', () => {
      const mappings = initializeDefaultControls();
      const controls = getAllControls();

      controls.forEach(control => {
        expect(mappings[control.id].label).toBe(control.defaultLabel);
      });
    });

    it('should preserve control type', () => {
      const mappings = initializeDefaultControls();
      const controls = getAllControls();

      controls.forEach(control => {
        expect(mappings[control.id].type).toBe(control.type);
      });
    });

    it('should preserve CC number', () => {
      const mappings = initializeDefaultControls();
      const controls = getAllControls();

      controls.forEach(control => {
        expect(mappings[control.id].ccNumber).toBe(control.cc);
      });
    });

    it('should create mappings for all knobs', () => {
      const mappings = initializeDefaultControls();
      const knobMappings = Object.values(mappings).filter(m => m.type === 'knob');
      expect(knobMappings).toHaveLength(24);
    });

    it('should create mappings for all faders', () => {
      const mappings = initializeDefaultControls();
      const faderMappings = Object.values(mappings).filter(m => m.type === 'fader');
      expect(faderMappings).toHaveLength(8);
    });

    it('should create mappings for all buttons', () => {
      const mappings = initializeDefaultControls();
      const buttonMappings = Object.values(mappings).filter(m => m.type === 'button');
      expect(buttonMappings).toHaveLength(16);
    });

    it('should return consistent results on multiple calls', () => {
      const mappings1 = initializeDefaultControls();
      const mappings2 = initializeDefaultControls();
      expect(mappings1).toEqual(mappings2);
    });

    it('should have proper key-value relationship', () => {
      const mappings = initializeDefaultControls();

      Object.entries(mappings).forEach(([key, value]) => {
        expect(value.id).toBe(key);
      });
    });
  });

  describe('integration between functions', () => {
    it('getAllControls should match getControlInfo results', () => {
      const allControls = getAllControls();

      allControls.forEach(control => {
        const parsed = getControlInfo(control.id);
        expect(parsed).toEqual(control);
      });
    });

    it('initializeDefaultControls should use getAllControls data', () => {
      const allControls = getAllControls();
      const mappings = initializeDefaultControls();

      allControls.forEach(control => {
        const mapping = mappings[control.id];
        expect(mapping.ccNumber).toBe(control.cc);
        expect(mapping.type).toBe(control.type);
        expect(mapping.label).toBe(control.defaultLabel);
      });
    });

    it('should handle roundtrip: getAllControls -> parse ID -> compare', () => {
      const allControls = getAllControls();

      allControls.forEach(control => {
        const reparsed = getControlInfo(control.id);
        expect(reparsed).not.toBeNull();
        expect(reparsed).toEqual(control);
      });
    });
  });
});
