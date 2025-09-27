export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  isConnected: boolean;
  input?: MIDIInput;
  output?: MIDIOutput;
}

export class MIDIConnectionManager {
  private midiAccess: MIDIAccess | null = null;
  private devices: Map<string, MIDIDevice> = new Map();
  private listeners: Set<(devices: MIDIDevice[]) => void> = new Set();
  private handshakeTimeouts: Map<string, number> = new Map();

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

    // Helper to normalize device names for pairing
    const normalizePortName = (name: string): string => {
      // "LCXL3 1 MIDI Out" -> "LCXL3 1 MIDI"
      // "LCXL3 1 MIDI In" -> "LCXL3 1 MIDI"
      return name.replace(/ (In|Out)$/i, '').trim();
    };

    inputs.forEach((input: MIDIInput) => {
      const baseName = normalizePortName(input.name || '');
      const key = `${input.manufacturer}-${baseName}`;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          id: input.id,
          name: baseName || 'Unknown Device',
          manufacturer: input.manufacturer || 'Unknown',
          state: input.state as 'connected' | 'disconnected',
          isConnected: false,
        });
      }
      deviceMap.get(key)!.input = input;
    });

    outputs.forEach((output: MIDIOutput) => {
      const baseName = normalizePortName(output.name || '');
      const key = `${output.manufacturer}-${baseName}`;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          id: output.id,
          name: baseName || 'Unknown Device',
          manufacturer: output.manufacturer || 'Unknown',
          state: output.state as 'connected' | 'disconnected',
          isConnected: false,
        });
      }
      deviceMap.get(key)!.output = output;
    });

    deviceMap.forEach((device) => {
      if (device.id) {
        const midiDevice = device as MIDIDevice;
        this.devices.set(device.id, midiDevice);

        // Auto-detect and handshake with LCXL3 devices
        if (this.isLaunchControlXL3(midiDevice)) {
          this.performHandshake(midiDevice).catch(console.error);
        }
      }
    });

    this.notifyListeners();
  }

  private isLaunchControlXL3(device: MIDIDevice): boolean {
    const name = device.name.toLowerCase();
    return name.includes('lcxl3') ||
           (name.includes('launch control xl') && name.includes('3'));
  }

  findLaunchControlXL3(): MIDIDevice | null {
    for (const device of this.devices.values()) {
      if (this.isLaunchControlXL3(device)) {
        return device;
      }
    }
    return null;
  }

  async performHandshake(device: MIDIDevice): Promise<boolean> {
    if (!device.input || !device.output) {
      console.warn(`Cannot perform handshake: device ${device.name} missing input or output`);
      return false;
    }

    if (device.isConnected) {
      return true; // Already connected
    }

    return new Promise((resolve) => {
      let responseReceived = false;

      // Clear any existing timeout for this device
      const existingTimeout = this.handshakeTimeouts.get(device.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set up response listener
      const handleSysExResponse = (event: MIDIMessageEvent) => {
        const data = Array.from(event.data);

        // Check if this is a device inquiry response (F0 7E device-id 06 02 ...)
        if (data.length >= 6 &&
            data[0] === 0xF0 &&
            data[1] === 0x7E &&
            data[3] === 0x06 &&
            data[4] === 0x02) {

          responseReceived = true;
          device.isConnected = true;
          device.input!.removeEventListener('midimessage', handleSysExResponse);

          console.log(`LCXL3 handshake successful for device: ${device.name}`);
          this.notifyListeners();
          resolve(true);
        }
      };

      // Listen for SysEx responses
      device.input.addEventListener('midimessage', handleSysExResponse);

      // Send device inquiry SysEx message
      const deviceInquiry = new Uint8Array([0xF0, 0x7E, 0x7F, 0x06, 0x01, 0xF7]);

      try {
        device.output.send(deviceInquiry);
        console.log(`Sent device inquiry to ${device.name}`);
      } catch (error) {
        console.error(`Failed to send device inquiry to ${device.name}:`, error);
        device.input.removeEventListener('midimessage', handleSysExResponse);
        resolve(false);
        return;
      }

      // Set timeout for handshake response
      const timeoutId = window.setTimeout(() => {
        if (!responseReceived) {
          device.input!.removeEventListener('midimessage', handleSysExResponse);
          this.handshakeTimeouts.delete(device.id);
          console.warn(`Handshake timeout for device: ${device.name}`);
          resolve(false);
        }
      }, 3000); // 3 second timeout

      this.handshakeTimeouts.set(device.id, timeoutId);
    });
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
    // Clear all handshake timeouts
    this.handshakeTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.handshakeTimeouts.clear();

    this.listeners.clear();
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }
    this.midiAccess = null;
    this.devices.clear();
  }
}