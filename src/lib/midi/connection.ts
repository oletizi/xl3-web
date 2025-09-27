export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  input?: MIDIInput;
  output?: MIDIOutput;
}

export class MIDIConnectionManager {
  private midiAccess: MIDIAccess | null = null;
  private devices: Map<string, MIDIDevice> = new Map();
  private listeners: Set<(devices: MIDIDevice[]) => void> = new Set();

  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      throw new Error('WebMIDI is not supported in this browser');
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      this.setupDeviceListeners();
      this.scanDevices();
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to access MIDI: ${error.message}`);
      }
      throw new Error('Failed to access MIDI: Unknown error');
    }
  }

  private setupDeviceListeners(): void {
    if (!this.midiAccess) return;

    this.midiAccess.onstatechange = (event: MIDIConnectionEvent) => {
      const port = event.port;
      if (port && (port.type === 'output' || port.type === 'input')) {
        this.scanDevices();
      }
    };
  }

  private scanDevices(): void {
    if (!this.midiAccess) return;

    this.devices.clear();

    const inputs = Array.from(this.midiAccess.inputs.values());
    const outputs = Array.from(this.midiAccess.outputs.values());

    const deviceMap = new Map<string, Partial<MIDIDevice>>();

    inputs.forEach((input: MIDIInput) => {
      const key = `${input.manufacturer}-${input.name}`;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          id: input.id,
          name: input.name || 'Unknown Device',
          manufacturer: input.manufacturer || 'Unknown',
          state: input.state as 'connected' | 'disconnected',
        });
      }
      deviceMap.get(key)!.input = input;
    });

    outputs.forEach((output: MIDIOutput) => {
      const key = `${output.manufacturer}-${output.name}`;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          id: output.id,
          name: output.name || 'Unknown Device',
          manufacturer: output.manufacturer || 'Unknown',
          state: output.state as 'connected' | 'disconnected',
        });
      }
      deviceMap.get(key)!.output = output;
    });

    deviceMap.forEach((device) => {
      if (device.id) {
        this.devices.set(device.id, device as MIDIDevice);
      }
    });

    this.notifyListeners();
  }

  findLaunchControlXL3(): MIDIDevice | null {
    for (const device of this.devices.values()) {
      if (
        device.name.toLowerCase().includes('launch control xl') ||
        device.name.toLowerCase().includes('xl3')
      ) {
        return device;
      }
    }
    return null;
  }

  getDevices(): MIDIDevice[] {
    return Array.from(this.devices.values());
  }

  onDeviceChange(callback: (devices: MIDIDevice[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getDevices());

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const devices = this.getDevices();
    this.listeners.forEach((listener) => listener(devices));
  }

  dispose(): void {
    this.listeners.clear();
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }
    this.midiAccess = null;
    this.devices.clear();
  }
}