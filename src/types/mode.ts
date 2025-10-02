export type ControlBehaviour = 'absolute' | 'relative1' | 'relative2';

export interface ControlMapping {
  id: string;
  type: 'knob' | 'fader' | 'button';
  ccNumber: number;
  midiChannel: number;
  minValue: number;
  maxValue: number;
  label?: string;
}

export interface CustomMode {
  name: string;
  description: string;
  version: string;
  controls: Record<string, ControlMapping>;
  createdAt: string;
  modifiedAt: string;
}

export interface ModeState {
  currentMode: CustomMode;
  isDirty: boolean;
}