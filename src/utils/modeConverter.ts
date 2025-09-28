import type { CustomMode, ControlMapping } from '@/types/mode';

/**
 * LCXL3 Control mapping format from @oletizi/launch-control-xl3 library
 */
export interface LCXL3Control {
  controlId: number;
  type?: 'knob' | 'fader' | 'button';
  controlType?: 'knob' | 'fader' | 'button';
  midiChannel?: number;
  channel?: number;
  ccNumber?: number;
  cc?: number;
  minValue?: number;
  min?: number;
  maxValue?: number;
  max?: number;
  behavior?: 'absolute' | 'relative' | 'toggle';
  behaviour?: string;
  transform?: string | ((value: number) => number);
}

/**
 * LCXL3 Mode format from @oletizi/launch-control-xl3 library
 */
export interface LCXL3CustomMode {
  name: string;
  controls: Record<string, LCXL3Control> | LCXL3Control[];
  labels?: Map<number, string>;
  colors?: Map<number, number>;
  leds?: Map<number, { color: number | string; behaviour: string }>;
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
    slot?: number;
    createdAt?: Date;
    modifiedAt?: Date;
    [key: string]: any;
  };
}

/**
 * Complete mapping between LCXL3 control IDs (hex values) and our control ID format
 * Based on CONTROL_IDS from @oletizi/launch-control-xl3/src/modes/CustomModeManager.ts
 *
 * LCXL3 Hardware Layout:
 * - Send A knobs (top row): 8 knobs
 * - Send B knobs (middle row): 8 knobs
 * - Pan/Device knobs (bottom row): 8 knobs
 * - Faders: 8 faders
 * - Focus buttons: 8 buttons
 * - Control buttons: 8 buttons
 * Total: 48 controls
 */
const LCXL3_TO_APP_CONTROL_MAP: Record<number, string> = {
  // Send A knobs (top row) - CC 13-20 (8 knobs)
  0x0D: 'knob-cc13',  // SEND_A1
  0x0E: 'knob-cc14',  // SEND_A2
  0x0F: 'knob-cc15',  // SEND_A3
  0x10: 'knob-cc16',  // SEND_A4
  0x11: 'knob-cc17',  // SEND_A5
  0x12: 'knob-cc18',  // SEND_A6
  0x13: 'knob-cc19',  // SEND_A7
  0x14: 'knob-cc20',  // SEND_A8

  // Send B knobs (middle row) - CC 29-36 (8 knobs)
  0x1D: 'knob-cc29',  // SEND_B1
  0x1E: 'knob-cc30',  // SEND_B2
  0x1F: 'knob-cc31',  // SEND_B3
  0x20: 'knob-cc32',  // SEND_B4
  0x21: 'knob-cc33',  // SEND_B5
  0x22: 'knob-cc34',  // SEND_B6
  0x23: 'knob-cc35',  // SEND_B7
  0x24: 'knob-cc36',  // SEND_B8

  // Pan/Device knobs (bottom row) - CC 22-28, 53 (8 knobs)
  0x31: 'knob-cc22',  // PAN1
  0x32: 'knob-cc23',  // PAN2
  0x33: 'knob-cc24',  // PAN3
  0x34: 'knob-cc25',  // PAN4
  0x35: 'knob-cc26',  // PAN5
  0x36: 'knob-cc27',  // PAN6
  0x37: 'knob-cc28',  // PAN7
  0x38: 'knob-cc53',  // PAN8

  // Faders - CC 5-12 (8 faders)
  0x4D: 'fader-cc5',  // FADER1
  0x4E: 'fader-cc6',  // FADER2
  0x4F: 'fader-cc7',  // FADER3
  0x50: 'fader-cc8',  // FADER4
  0x51: 'fader-cc9',  // FADER5
  0x52: 'fader-cc10', // FADER6
  0x53: 'fader-cc11', // FADER7
  0x54: 'fader-cc12', // FADER8

  // Track focus buttons - CC 41-48 (8 buttons)
  0x29: 'button-cc41', // FOCUS1
  0x2A: 'button-cc42', // FOCUS2
  0x2B: 'button-cc43', // FOCUS3
  0x2C: 'button-cc44', // FOCUS4
  0x2D: 'button-cc45', // FOCUS5
  0x2E: 'button-cc46', // FOCUS6
  0x2F: 'button-cc47', // FOCUS7
  0x30: 'button-cc48', // FOCUS8

  // Track control buttons - CC 37-40, 49-52 (8 buttons)
  0x39: 'button-cc37', // CONTROL1
  0x3A: 'button-cc38', // CONTROL2
  0x3B: 'button-cc39', // CONTROL3
  0x3C: 'button-cc40', // CONTROL4
  0x3D: 'button-cc49', // CONTROL5
  0x3E: 'button-cc50', // CONTROL6
  0x3F: 'button-cc51', // CONTROL7
  0x40: 'button-cc52', // CONTROL8
};

export function lcxl3ModeToCustomMode(lcxl3Mode: LCXL3CustomMode): CustomMode {
  const controls: Record<string, ControlMapping> = {};

  const controlsArray = Array.isArray(lcxl3Mode.controls)
    ? lcxl3Mode.controls
    : Object.values(lcxl3Mode.controls);

  for (const control of controlsArray) {
    const ourControlId = LCXL3_TO_APP_CONTROL_MAP[control.controlId];

    if (!ourControlId) {
      console.warn(`Unknown LCXL3 controlId: 0x${control.controlId.toString(16).toUpperCase()}`);
      continue;
    }

    const ccNumber = control.ccNumber ?? control.cc;
    const midiChannel = control.midiChannel ?? control.channel;
    const minValue = control.minValue ?? control.min ?? 0;
    const maxValue = control.maxValue ?? control.max ?? 127;

    if (ccNumber === undefined || midiChannel === undefined) {
      console.warn(`Missing CC or channel for controlId: 0x${control.controlId.toString(16)}`);
      continue;
    }

    const controlType = ourControlId.startsWith('knob-')
      ? 'knob'
      : ourControlId.startsWith('fader-')
        ? 'fader'
        : 'button';

    controls[ourControlId] = {
      id: ourControlId,
      type: controlType,
      ccNumber,
      midiChannel,
      minValue,
      maxValue,
      label: ''
    };
  }

  return {
    name: lcxl3Mode.name || 'Fetched Mode',
    description: `Fetched from device on ${new Date().toLocaleString()}`,
    version: '1.0.0',
    controls,
    createdAt: lcxl3Mode.metadata?.createdAt?.toISOString() || new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
}

/**
 * Reverse mapping from our control IDs to LCXL3 control hex IDs
 */
const APP_TO_LCXL3_CONTROL_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(LCXL3_TO_APP_CONTROL_MAP).map(([lcxl3Id, ourId]) => [ourId, parseInt(lcxl3Id)])
);

/**
 * Convert our CustomMode format to LCXL3 mode format
 * This function may be useful for sending modes to the device in the future
 */
export function customModeToLCXL3Mode(customMode: CustomMode): LCXL3CustomMode {
  const controls: Record<string, LCXL3Control> = {};
  const labels = new Map<number, string>();

  // Process each control mapping from our custom mode
  for (const [ourControlId, control] of Object.entries(customMode.controls)) {
    const lcxl3ControlId = APP_TO_LCXL3_CONTROL_MAP[ourControlId];
    if (!lcxl3ControlId) {
      console.warn(`No LCXL3 mapping found for control ID: ${ourControlId}`);
      continue;
    }

    const controlKey = `control_${lcxl3ControlId.toString(16).padStart(2, '0').toUpperCase()}`;

    controls[controlKey] = {
      controlId: lcxl3ControlId,
      type: control.type,
      midiChannel: control.midiChannel,
      ccNumber: control.ccNumber,
      minValue: control.minValue,
      maxValue: control.maxValue,
      behavior: 'absolute'
    };

    // Add label to labels map if provided
    if (control.label) {
      labels.set(lcxl3ControlId, control.label);
    }
  }

  return {
    name: customMode.name.substring(0, 8), // LCXL3 names limited to 8 chars
    controls,
    labels,
    metadata: {
      name: customMode.name,
      description: customMode.description,
      version: customMode.version
    }
  };
}

/**
 * Get all supported LCXL3 control hex IDs
 */
export function getAllLCXL3ControlIds(): number[] {
  return Object.keys(LCXL3_TO_APP_CONTROL_MAP).map(hex => parseInt(hex));
}

/**
 * Get all our control IDs that map to LCXL3 controls
 */
export function getAllMappedControlIds(): string[] {
  return Object.values(LCXL3_TO_APP_CONTROL_MAP);
}

/**
 * Check if a control ID is supported for LCXL3 conversion
 */
export function isControlIdMapped(controlId: string): boolean {
  return controlId in APP_TO_LCXL3_CONTROL_MAP;
}

/**
 * Get the LCXL3 control hex ID for our control ID
 */
export function getLCXL3ControlId(ourControlId: string): number | null {
  return APP_TO_LCXL3_CONTROL_MAP[ourControlId] ?? null;
}

/**
 * Get our control ID for an LCXL3 control hex ID
 */
export function getOurControlId(lcxl3ControlId: number): string | null {
  return LCXL3_TO_APP_CONTROL_MAP[lcxl3ControlId] ?? null;
}

/**
 * Get control mapping statistics
 */
export function getControlMappingStats() {
  const totalControls = Object.keys(LCXL3_TO_APP_CONTROL_MAP).length;
  const knobControls = Object.values(LCXL3_TO_APP_CONTROL_MAP).filter(id => id.startsWith('knob-')).length;
  const faderControls = Object.values(LCXL3_TO_APP_CONTROL_MAP).filter(id => id.startsWith('fader-')).length;
  const buttonControls = Object.values(LCXL3_TO_APP_CONTROL_MAP).filter(id => id.startsWith('button-')).length;

  return {
    total: totalControls,
    knobs: knobControls,
    faders: faderControls,
    buttons: buttonControls,
    expectedTotal: 48 // 24 knobs + 8 faders + 16 buttons
  };
}