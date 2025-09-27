import type { ControlMapping } from '@/types/mode';

export interface ControlInfo {
  id: string;
  cc: number;
  type: 'knob' | 'fader' | 'button';
  defaultLabel: string;
}

/**
 * Parse control ID and return control information
 * Supports formats: "knob-cc13", "fader-cc5", "button-cc37"
 */
export function getControlInfo(controlId: string): ControlInfo | null {
  const match = controlId.match(/^(knob|fader|button)-cc(\d+)$/);
  if (!match) {
    return null;
  }

  const [, type, ccStr] = match;
  const cc = parseInt(ccStr, 10);

  if (isNaN(cc) || cc < 0 || cc > 127) {
    return null;
  }

  // Validate CC numbers are in expected ranges
  const validType = type as 'knob' | 'fader' | 'button';
  if (!isValidCCForType(cc, validType)) {
    return null;
  }

  return {
    id: controlId,
    cc,
    type: validType,
    defaultLabel: `${type.charAt(0).toUpperCase() + type.slice(1)} ${cc}`
  };
}

/**
 * Validate that CC number is in the expected range for control type
 */
function isValidCCForType(cc: number, type: 'knob' | 'fader' | 'button'): boolean {
  switch (type) {
    case 'knob':
      // Knobs: CC 13-20, 53, 22-36
      return (cc >= 13 && cc <= 20) || cc === 53 || (cc >= 22 && cc <= 36);
    case 'fader':
      // Faders: CC 5-12
      return cc >= 5 && cc <= 12;
    case 'button':
      // Buttons: CC 37-52
      return cc >= 37 && cc <= 52;
    default:
      return false;
  }
}

/**
 * Get all 48 control definitions
 */
export function getAllControls(): ControlInfo[] {
  const controls: ControlInfo[] = [];

  // Knobs: CC 13-20, 53, 22-36 (24 total)
  for (let cc = 13; cc <= 20; cc++) {
    controls.push({
      id: `knob-cc${cc}`,
      cc,
      type: 'knob',
      defaultLabel: `Knob ${cc}`
    });
  }

  // CC 53 knob
  controls.push({
    id: 'knob-cc53',
    cc: 53,
    type: 'knob',
    defaultLabel: 'Knob 53'
  });

  for (let cc = 22; cc <= 36; cc++) {
    controls.push({
      id: `knob-cc${cc}`,
      cc,
      type: 'knob',
      defaultLabel: `Knob ${cc}`
    });
  }

  // Faders: CC 5-12 (8 total)
  for (let cc = 5; cc <= 12; cc++) {
    controls.push({
      id: `fader-cc${cc}`,
      cc,
      type: 'fader',
      defaultLabel: `Fader ${cc}`
    });
  }

  // Buttons: CC 37-52 (16 total)
  for (let cc = 37; cc <= 52; cc++) {
    controls.push({
      id: `button-cc${cc}`,
      cc,
      type: 'button',
      defaultLabel: `Button ${cc}`
    });
  }

  return controls;
}

/**
 * Initialize default control mappings for all 48 controls
 */
export function initializeDefaultControls(): Record<string, ControlMapping> {
  const controls = getAllControls();
  const mappings: Record<string, ControlMapping> = {};

  for (const control of controls) {
    mappings[control.id] = {
      id: control.id,
      type: control.type,
      ccNumber: control.cc,
      midiChannel: 1,
      minValue: 0,
      maxValue: 127,
      label: control.defaultLabel
    };
  }

  return mappings;
}