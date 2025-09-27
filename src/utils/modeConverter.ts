import type { CustomMode, ControlMapping } from '@/types/mode';

export interface LCXL3Control {
  controlId: number;
  type?: string;
  midiChannel?: number;
  channel?: number;
  ccNumber?: number;
  cc?: number;
  minValue?: number;
  min?: number;
  maxValue?: number;
  max?: number;
  behavior?: string;
  behaviour?: string;
}

export interface LCXL3CustomMode {
  name: string;
  controls: Record<string, LCXL3Control> | LCXL3Control[];
  leds?: Map<number, { color: number | string; behaviour: string }>;
  metadata?: {
    slot?: number;
    createdAt?: Date;
    modifiedAt?: Date;
  };
}

const LCXL3_TO_APP_CONTROL_MAP: Record<number, string> = {
  0x0D: 'knob-cc13',
  0x0E: 'knob-cc14',
  0x0F: 'knob-cc15',
  0x10: 'knob-cc16',
  0x11: 'knob-cc17',
  0x12: 'knob-cc18',
  0x13: 'knob-cc19',
  0x14: 'knob-cc20',

  0x1D: 'knob-cc29',
  0x1E: 'knob-cc30',
  0x1F: 'knob-cc31',
  0x20: 'knob-cc32',
  0x21: 'knob-cc33',
  0x22: 'knob-cc22',
  0x23: 'knob-cc23',
  0x24: 'knob-cc24',

  0x31: 'knob-cc49',
  0x32: 'knob-cc50',
  0x33: 'knob-cc51',
  0x34: 'knob-cc52',
  0x35: 'knob-cc53',
  0x36: 'knob-cc25',
  0x37: 'knob-cc26',
  0x38: 'knob-cc27',

  0x4D: 'fader-cc5',
  0x4E: 'fader-cc6',
  0x4F: 'fader-cc7',
  0x50: 'fader-cc8',
  0x51: 'fader-cc9',
  0x52: 'fader-cc10',
  0x53: 'fader-cc11',
  0x54: 'fader-cc12',

  0x29: 'button-cc41',
  0x2A: 'button-cc42',
  0x2B: 'button-cc43',
  0x2C: 'button-cc44',
  0x2D: 'button-cc45',
  0x2E: 'button-cc46',
  0x2F: 'button-cc47',
  0x30: 'button-cc48',

  0x39: 'button-cc37',
  0x3A: 'button-cc38',
  0x3B: 'button-cc39',
  0x3C: 'button-cc40',
  0x3D: 'button-cc49',
  0x3E: 'button-cc50',
  0x3F: 'button-cc51',
  0x40: 'button-cc52',
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
      midiChannel: midiChannel + 1,
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