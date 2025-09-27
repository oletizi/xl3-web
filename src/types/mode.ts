export type ControlBehaviour = 'absolute' | 'relative1' | 'relative2';

export interface ControlMapping {
  type: 'knob' | 'fader' | 'button';
  channel: number;
  cc: number;
  min: number;
  max: number;
  behaviour: ControlBehaviour;
}

export interface CustomMode {
  name: string;
  description?: string;
  controls: Record<string, ControlMapping>;
}

export interface ModeState {
  currentMode: CustomMode;
  isDirty: boolean;
}