export type ControlType = 'knob' | 'fader' | 'button';

export interface Control {
  id: string;
  type: ControlType;
  label: string;
  ccNumber: number;
  channel: number;
  x: number;
  y: number;
}

export interface ControlSelection {
  control: Control | null;
}