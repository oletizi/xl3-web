import type { CustomMode, ControlMapping } from '@/types/mode';
import type {
  CustomMode as LCXL3CustomMode,
  ControlMapping as LCXL3Control
} from '@oletizi/launch-control-xl3';

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
 * Correct mapping for LCXL3 library v1.9.0+
 * Maps library control IDs to our internal control IDs
 */
const LCXL3_TO_APP_CONTROL_MAP: Record<number, string> = {
  // Send A knobs (top row) - CC 13-20 - FIXED IDs 0x10-0x17
  0x10: 'knob-cc13',
  0x11: 'knob-cc14',
  0x12: 'knob-cc15',
  0x13: 'knob-cc16',
  0x14: 'knob-cc17',
  0x15: 'knob-cc18',
  0x16: 'knob-cc19',
  0x17: 'knob-cc20',

  // Send B knobs (middle row) - CC 29-36 - FIXED IDs 0x18-0x1F
  0x18: 'knob-cc29',
  0x19: 'knob-cc30',
  0x1A: 'knob-cc31',
  0x1B: 'knob-cc32',
  0x1C: 'knob-cc33',
  0x1D: 'knob-cc34',
  0x1E: 'knob-cc35',
  0x1F: 'knob-cc36',

  // Pan/Device knobs (bottom row) - CC 22-28, 53 - FIXED IDs 0x20-0x27
  0x20: 'knob-cc22',
  0x21: 'knob-cc23',
  0x22: 'knob-cc24',
  0x23: 'knob-cc25',
  0x24: 'knob-cc26',
  0x25: 'knob-cc27',
  0x26: 'knob-cc28',
  0x27: 'knob-cc53',

  // Faders - CC 5-12 - FIXED IDs 0x28-0x2F
  0x28: 'fader-cc5',
  0x29: 'fader-cc6',
  0x2A: 'fader-cc7',
  0x2B: 'fader-cc8',
  0x2C: 'fader-cc9',
  0x2D: 'fader-cc10',
  0x2E: 'fader-cc11',
  0x2F: 'fader-cc12',

  // Track focus buttons - CC 41-48 - FIXED IDs 0x30-0x37
  0x30: 'button-cc41',
  0x31: 'button-cc42',
  0x32: 'button-cc43',
  0x33: 'button-cc44',
  0x34: 'button-cc45',
  0x35: 'button-cc46',
  0x36: 'button-cc47',
  0x37: 'button-cc48',

  // Track control buttons - CC 37-40, 49-52 - FIXED IDs 0x38-0x3F
  0x38: 'button-cc37',
  0x39: 'button-cc38',
  0x3A: 'button-cc39',
  0x3B: 'button-cc40',
  0x3C: 'button-cc49',
  0x3D: 'button-cc50',
  0x3E: 'button-cc51',
  0x3F: 'button-cc52'
};

export function lcxl3ModeToCustomMode(lcxl3Mode: LCXL3CustomMode): CustomMode {
  const controls: Record<string, ControlMapping> = {};

  if (!lcxl3Mode.controls) {
    console.warn('No controls found in mode:', lcxl3Mode);
    return {
      name: lcxl3Mode.name || 'Fetched Mode',
      description: `Fetched from device on ${new Date().toLocaleString()}`,
      version: '1.0.0',
      controls: {},
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
  }

  let controlsArray: LCXL3Control[];
  if (Array.isArray(lcxl3Mode.controls)) {
    controlsArray = lcxl3Mode.controls;
  } else if (lcxl3Mode.controls instanceof Map) {
    controlsArray = Array.from(lcxl3Mode.controls.values());
  } else if (typeof lcxl3Mode.controls === 'object') {
    controlsArray = Object.values(lcxl3Mode.controls);
  } else {
    console.error('Unknown controls format:', typeof lcxl3Mode.controls, lcxl3Mode.controls);
    throw new Error(`Invalid controls format: ${typeof lcxl3Mode.controls}`);
  }

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
      label: control.name || ''
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
 * Mapping from our control IDs to library's named constants
 * Based on CONTROL_IDS in @oletizi/launch-control-xl3 v1.9.0
 */
const APP_TO_LCXL3_CONTROL_NAMES: Record<string, string> = {
  // Send A knobs - map to SEND_A1-SEND_A8
  'knob-cc13': 'SEND_A1',
  'knob-cc14': 'SEND_A2',
  'knob-cc15': 'SEND_A3',
  'knob-cc16': 'SEND_A4',
  'knob-cc17': 'SEND_A5',
  'knob-cc18': 'SEND_A6',
  'knob-cc19': 'SEND_A7',
  'knob-cc20': 'SEND_A8',

  // Send B knobs - map to SEND_B1-SEND_B8
  'knob-cc29': 'SEND_B1',
  'knob-cc30': 'SEND_B2',
  'knob-cc31': 'SEND_B3',
  'knob-cc32': 'SEND_B4',
  'knob-cc33': 'SEND_B5',
  'knob-cc34': 'SEND_B6',
  'knob-cc35': 'SEND_B7',
  'knob-cc36': 'SEND_B8',

  // Pan/Device knobs - map to PAN1-PAN8
  'knob-cc22': 'PAN1',
  'knob-cc23': 'PAN2',
  'knob-cc24': 'PAN3',
  'knob-cc25': 'PAN4',
  'knob-cc26': 'PAN5',
  'knob-cc27': 'PAN6',
  'knob-cc28': 'PAN7',
  'knob-cc53': 'PAN8',

  // Faders - map to FADER1-FADER8
  'fader-cc5': 'FADER1',
  'fader-cc6': 'FADER2',
  'fader-cc7': 'FADER3',
  'fader-cc8': 'FADER4',
  'fader-cc9': 'FADER5',
  'fader-cc10': 'FADER6',
  'fader-cc11': 'FADER7',
  'fader-cc12': 'FADER8',

  // Focus buttons - map to FOCUS1-FOCUS8
  'button-cc41': 'FOCUS1',
  'button-cc42': 'FOCUS2',
  'button-cc43': 'FOCUS3',
  'button-cc44': 'FOCUS4',
  'button-cc45': 'FOCUS5',
  'button-cc46': 'FOCUS6',
  'button-cc47': 'FOCUS7',
  'button-cc48': 'FOCUS8',

  // Control buttons - map to CONTROL1-CONTROL8
  'button-cc37': 'CONTROL1',
  'button-cc38': 'CONTROL2',
  'button-cc39': 'CONTROL3',
  'button-cc40': 'CONTROL4',
  'button-cc49': 'CONTROL5',
  'button-cc50': 'CONTROL6',
  'button-cc51': 'CONTROL7',
  'button-cc52': 'CONTROL8',
};

/**
 * Convert our CustomMode format to LCXL3 mode format
 * Uses library's named constants (SEND_A1, FADER1, etc.) as required by v1.9.0+
 */
export function customModeToLCXL3Mode(customMode: CustomMode): LCXL3CustomMode {
  const controls: Record<string, LCXL3Control> = {};
  const labels = new Map<number, string>();

  // Process each control mapping from our custom mode
  for (const [ourControlId, control] of Object.entries(customMode.controls)) {
    const controlName = APP_TO_LCXL3_CONTROL_NAMES[ourControlId];
    if (!controlName) {
      console.warn(`No LCXL3 control name found for: ${ourControlId}`);
      continue;
    }

    // Use library's expected format with named keys and specific field names
    controls[controlName] = {
      controlId: APP_TO_LCXL3_CONTROL_MAP[ourControlId],
      type: control.type,
      channel: control.midiChannel,      // Library uses 'channel' not 'midiChannel'
      cc: control.ccNumber,               // Library uses 'cc' not 'ccNumber'
      min: control.minValue,              // Library uses 'min' not 'minValue'
      max: control.maxValue,              // Library uses 'max' not 'maxValue'
      behaviour: 'absolute',              // Library uses 'behaviour' not 'behavior'
      name: control.label                 // Add label as 'name' property
    };

    // Add label to labels map if provided (for compatibility)
    if (control.label) {
      labels.set(APP_TO_LCXL3_CONTROL_MAP[ourControlId], control.label);
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