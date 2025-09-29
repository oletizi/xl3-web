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
 * Mapping from CC numbers and control types to our control IDs
 * This matches the actual response format from the LCXL3 library
 */
const CC_TO_CONTROL_MAP: Record<string, string> = {
  // Send A knobs (top row) - CC 13-20 (8 knobs)
  'knob-13': 'knob-cc13',
  'knob-14': 'knob-cc14',
  'knob-15': 'knob-cc15',
  'knob-16': 'knob-cc16',
  'knob-17': 'knob-cc17',
  'knob-18': 'knob-cc18',
  'knob-19': 'knob-cc19',
  'knob-20': 'knob-cc20',

  // Send B knobs (middle row) - CC 29-36 (8 knobs)
  'knob-29': 'knob-cc29',
  'knob-30': 'knob-cc30',
  'knob-31': 'knob-cc31',
  'knob-32': 'knob-cc32',
  'knob-33': 'knob-cc33',
  'knob-34': 'knob-cc34',
  'knob-35': 'knob-cc35',
  'knob-36': 'knob-cc36',

  // Pan/Device knobs (bottom row) - CC 22-28, 53 (8 knobs)
  'knob-22': 'knob-cc22',
  'knob-23': 'knob-cc23',
  'knob-24': 'knob-cc24',
  'knob-25': 'knob-cc25',
  'knob-26': 'knob-cc26',
  'knob-27': 'knob-cc27',
  'knob-28': 'knob-cc28',
  'knob-53': 'knob-cc53',

  // Faders - CC 5-12 (8 faders)
  'fader-5': 'fader-cc5',
  'fader-6': 'fader-cc6',
  'fader-7': 'fader-cc7',
  'fader-8': 'fader-cc8',
  'fader-9': 'fader-cc9',
  'fader-10': 'fader-cc10',
  'fader-11': 'fader-cc11',
  'fader-12': 'fader-cc12',

  // Track focus buttons - CC 41-48 (8 buttons)
  'button-41': 'button-cc41',
  'button-42': 'button-cc42',
  'button-43': 'button-cc43',
  'button-44': 'button-cc44',
  'button-45': 'button-cc45',
  'button-46': 'button-cc46',
  'button-47': 'button-cc47',
  'button-48': 'button-cc48',

  // Track control buttons - CC 37-40, 49-52 (8 buttons)
  'button-37': 'button-cc37',
  'button-38': 'button-cc38',
  'button-39': 'button-cc39',
  'button-40': 'button-cc40',
  'button-49': 'button-cc49',
  'button-50': 'button-cc50',
  'button-51': 'button-cc51',
  'button-52': 'button-cc52'
};

/**
 * Legacy mapping for controlId-based format (kept for compatibility)
 */
const LCXL3_TO_APP_CONTROL_MAP: Record<number, string> = {
  // Send A knobs (top row) - CC 13-20 (8 knobs)
  0x0D: 'knob-cc13',
  0x0E: 'knob-cc14',
  0x0F: 'knob-cc15',
  0x10: 'knob-cc16',
  0x11: 'knob-cc17',
  0x12: 'knob-cc18',
  0x13: 'knob-cc19',
  0x14: 'knob-cc20',

  // Send B knobs (middle row) - CC 29-36 (8 knobs)
  0x1D: 'knob-cc29',
  0x1E: 'knob-cc30',
  0x1F: 'knob-cc31',
  0x20: 'knob-cc32',
  0x21: 'knob-cc33',
  0x22: 'knob-cc34',
  0x23: 'knob-cc35',
  0x24: 'knob-cc36',

  // Pan/Device knobs (bottom row) - CC 22-28, 53 (8 knobs)
  0x31: 'knob-cc22',
  0x32: 'knob-cc23',
  0x33: 'knob-cc24',
  0x34: 'knob-cc25',
  0x35: 'knob-cc26',
  0x36: 'knob-cc27',
  0x37: 'knob-cc28',
  0x38: 'knob-cc53',

  // Faders - CC 5-12 (8 faders)
  0x4D: 'fader-cc5',
  0x4E: 'fader-cc6',
  0x4F: 'fader-cc7',
  0x50: 'fader-cc8',
  0x51: 'fader-cc9',
  0x52: 'fader-cc10',
  0x53: 'fader-cc11',
  0x54: 'fader-cc12',

  // Track focus buttons - CC 41-48 (8 buttons)
  0x29: 'button-cc41',
  0x2A: 'button-cc42',
  0x2B: 'button-cc43',
  0x2C: 'button-cc44',
  0x2D: 'button-cc45',
  0x2E: 'button-cc46',
  0x2F: 'button-cc47',
  0x30: 'button-cc48',

  // Track control buttons - CC 37-40, 49-52 (8 buttons)
  0x39: 'button-cc37',
  0x3A: 'button-cc38',
  0x3B: 'button-cc39',
  0x3C: 'button-cc40',
  0x3D: 'button-cc49',
  0x3E: 'button-cc50',
  0x3F: 'button-cc51',
  0x40: 'button-cc52'
};

export function lcxl3ModeToCustomMode(lcxl3Mode: LCXL3CustomMode): CustomMode {
  const controls: Record<string, ControlMapping> = {};

  const controlsArray = Array.isArray(lcxl3Mode.controls)
    ? lcxl3Mode.controls
    : Object.values(lcxl3Mode.controls);

  for (const control of controlsArray) {
    // Try to determine control ID using different methods
    let ourControlId: string | null = null;

    // Method 1: Use controlId if available (legacy format)
    if (control.controlId || control.controlId === 0) {
      ourControlId = LCXL3_TO_APP_CONTROL_MAP[control.controlId];
    }

    // Method 2: Use CC number and type (current library format)
    if (!ourControlId) {
      const ccNumber = control.ccNumber ?? control.cc;
      const controlType = control.type ?? control.controlType;

      if (ccNumber !== undefined && controlType) {
        const lookupKey = `${controlType}-${ccNumber}`;
        ourControlId = CC_TO_CONTROL_MAP[lookupKey];

        if (!ourControlId) {
          console.warn(`No mapping found for ${lookupKey}:`, control);
        }
      } else {
        console.warn(`Control missing type or CC:`, control);
        continue;
      }
    }

    if (!ourControlId) {
      continue;
    }

    const ccNumber = control.ccNumber ?? control.cc;
    const midiChannel = control.midiChannel ?? control.channel ?? 0;
    const minValue = control.minValue ?? control.min ?? 0;
    const maxValue = control.maxValue ?? control.max ?? 127;

    if (ccNumber === undefined) {
      console.warn(`Missing CC number for control:`, control);
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
    createdAt: lcxl3Mode.metadata?.createdAt instanceof Date
      ? lcxl3Mode.metadata.createdAt.toISOString()
      : new Date().toISOString(),
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