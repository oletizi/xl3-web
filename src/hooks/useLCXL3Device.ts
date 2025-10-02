import { useState, useEffect } from 'react';
import {
  LaunchControlXL3,
  type MidiBackendInterface,
  type MidiPortInfo,
  type MidiInputPort,
  type MidiOutputPort,
  type MidiPort,
  type MidiMessage
} from '@oletizi/launch-control-xl3';
import type { LCXL3CustomMode } from '@/utils/modeConverter';

/**
 * Simple Web MIDI API backend implementation for LCXL3
 */
class WebMidiBackend implements MidiBackendInterface {
  private midiAccess?: MIDIAccess;
  private openInputs: Map<string, MIDIInput> = new Map();
  private openOutputs: Map<string, MIDIOutput> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if Web MIDI API is available
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API not available. Requires modern browser with MIDI support and HTTPS.');
    }

    try {
      // Request MIDI access with SysEx permission (required for custom modes)
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });

      // Set up connection state change handler
      this.midiAccess.onstatechange = (event) => {
        if (event.port) {
          console.debug('[WebMidiBackend] MIDI port state changed:', event.port.name, event.port.state);
        }
      };

      this.isInitialized = true;
      console.log('[WebMidiBackend] Web MIDI API initialized successfully');
    } catch (error: any) {
      if (error.name === 'SecurityError') {
        throw new Error('MIDI access denied. Web MIDI requires user permission and HTTPS in production.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Web MIDI API not supported in this browser.');
      } else {
        throw new Error(`Failed to initialize Web MIDI API: ${error.message}`);
      }
    }
  }

  async getInputPorts(): Promise<MidiPortInfo[]> {
    if (!this.isInitialized || !this.midiAccess) {
      throw new Error('Backend not initialized');
    }

    const ports: MidiPortInfo[] = [];
    this.midiAccess.inputs.forEach((port, id) => {
      ports.push({
        id,
        name: port.name || `Input ${id}`,
        ...(port.manufacturer && { manufacturer: port.manufacturer }),
        ...(port.version && { version: port.version })
      });
    });

    return ports;
  }

  async getOutputPorts(): Promise<MidiPortInfo[]> {
    if (!this.isInitialized || !this.midiAccess) {
      throw new Error('Backend not initialized');
    }

    const ports: MidiPortInfo[] = [];
    this.midiAccess.outputs.forEach((port, id) => {
      ports.push({
        id,
        name: port.name || `Output ${id}`,
        ...(port.manufacturer && { manufacturer: port.manufacturer }),
        ...(port.version && { version: port.version })
      });
    });

    return ports;
  }

  async openInput(portId: string): Promise<MidiInputPort> {
    if (!this.isInitialized || !this.midiAccess) {
      throw new Error('Backend not initialized');
    }

    let midiInput: MIDIInput | undefined;
    this.midiAccess.inputs.forEach((input, id) => {
      if (id === portId) {
        midiInput = input;
      }
    });

    if (!midiInput) {
      throw new Error(`Input port not found: ${portId}`);
    }

    try {
      await midiInput.open();

      const port: MidiInputPort = {
        id: portId,
        name: midiInput.name || `Input ${portId}`,
        type: 'input',
        close: async () => {
          await midiInput!.close();
          this.openInputs.delete(portId);
        },
        onMessage: undefined
      };

      // Set up message handler
      midiInput.onmidimessage = (event: any) => {
        if (port.onMessage) {
          const data: number[] = Array.from(event.data as Uint8Array);
          port.onMessage({
            timestamp: event.timeStamp,
            data
          });
        }
      };

      this.openInputs.set(portId, midiInput);
      return port;
    } catch (error: any) {
      throw new Error(`Failed to open input port ${portId}: ${error.message}`);
    }
  }

  async openOutput(portId: string): Promise<MidiOutputPort> {
    if (!this.isInitialized || !this.midiAccess) {
      throw new Error('Backend not initialized');
    }

    let midiOutput: MIDIOutput | undefined;
    this.midiAccess.outputs.forEach((output, id) => {
      if (id === portId) {
        midiOutput = output;
      }
    });

    if (!midiOutput) {
      throw new Error(`Output port not found: ${portId}`);
    }

    try {
      await midiOutput.open();

      const port: MidiOutputPort = {
        id: portId,
        name: midiOutput.name || `Output ${portId}`,
        type: 'output',
        close: async () => {
          await midiOutput!.close();
          this.openOutputs.delete(portId);
        }
      };

      this.openOutputs.set(portId, midiOutput);
      return port;
    } catch (error: any) {
      throw new Error(`Failed to open output port ${portId}: ${error.message}`);
    }
  }

  async sendMessage(port: MidiOutputPort, message: MidiMessage): Promise<void> {
    const midiOutput = this.openOutputs.get(port.id);
    if (!midiOutput) {
      throw new Error(`Output port not open: ${port.id}`);
    }

    try {
      const data = new Uint8Array(message.data);
      await midiOutput.send(data);
    } catch (error: any) {
      throw new Error(`Failed to send MIDI message: ${error.message}`);
    }
  }

  async closePort(port: MidiPort): Promise<void> {
    if (port.type === 'input') {
      const midiInput = this.openInputs.get(port.id);
      if (midiInput) {
        await midiInput.close();
        this.openInputs.delete(port.id);
      }
    } else {
      const midiOutput = this.openOutputs.get(port.id);
      if (midiOutput) {
        await midiOutput.close();
        this.openOutputs.delete(port.id);
      }
    }
  }

  async cleanup(): Promise<void> {
    // Close all open ports
    for (const [id, input] of this.openInputs) {
      try {
        await input.close();
      } catch (error) {
        console.warn(`Failed to close input port ${id}:`, error);
      }
    }

    for (const [id, output] of this.openOutputs) {
      try {
        await output.close();
      } catch (error) {
        console.warn(`Failed to close output port ${id}:`, error);
      }
    }

    this.openInputs.clear();
    this.openOutputs.clear();
    this.isInitialized = false;
  }
}

export interface LCXL3DeviceState {
  device: LaunchControlXL3 | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
}

export function useLCXL3Device() {
  const [device, setDevice] = useState<LaunchControlXL3 | null>(null);
  const [midiBackend, setMidiBackend] = useState<WebMidiBackend | null>(null);

  const [state, setState] = useState<LCXL3DeviceState>({
    device: null,
    isConnected: false,
    isInitialized: false,
    error: null
  });

  useEffect(() => {
    console.log('[useLCXL3Device] Initializing MIDI backend and device...');

    const initDevice = async () => {
      try {
        // Step 1: Initialize Web MIDI backend
        console.log('[useLCXL3Device] Creating and initializing Web MIDI backend...');
        const backend = new WebMidiBackend();
        await backend.initialize();
        setMidiBackend(backend);

        // Step 2: Create LaunchControlXL3 instance with initialized backend
        console.log('[useLCXL3Device] Creating LaunchControlXL3 instance with MIDI backend...');
        const deviceInstance = new LaunchControlXL3({
          midiBackend: backend,
          enableCustomModes: true,
          enableLedControl: false,
          reconnectOnError: true,
          maxReconnectAttempts: 5
        });

        // Step 3: Set up event listeners
        const handleConnected = () => {
          console.log('[useLCXL3Device] Device connected event');
          setState(prev => ({ ...prev, device: deviceInstance, isConnected: true }));
        };

        const handleReady = () => {
          console.log('[useLCXL3Device] Device ready event');
          setState(prev => ({ ...prev, device: deviceInstance, isConnected: true }));
        };

        const handleDisconnected = () => {
          console.log('[useLCXL3Device] Device disconnected event');
          setState(prev => ({ ...prev, isConnected: false }));
        };

        const handleError = (error: Error) => {
          console.error('[useLCXL3Device] Device error:', error);
          setState(prev => ({
            ...prev,
            error: error.message || 'Device error',
            isConnected: false
          }));
        };

        deviceInstance.on('device:connected', handleConnected);
        deviceInstance.on('device:ready', handleReady);
        deviceInstance.on('device:disconnected', handleDisconnected);
        deviceInstance.on('device:error', handleError);

        setDevice(deviceInstance);

        // Step 4: Connect to device
        console.log('[useLCXL3Device] Connecting to device...');
        await deviceInstance.connect();
        console.log('[useLCXL3Device] Device connected, isConnected:', deviceInstance.isConnected());

        setState(prev => ({
          ...prev,
          device: deviceInstance,
          isConnected: deviceInstance.isConnected(),
          isInitialized: true,
          error: null
        }));

        // Store cleanup functions for later use
        (deviceInstance as any).__cleanupFunctions = {
          handleConnected,
          handleReady,
          handleDisconnected,
          handleError
        };

      } catch (error) {
        console.error('[useLCXL3Device] Initialization error:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize device',
          isInitialized: true
        }));
      }
    };

    initDevice();

    return () => {
      console.log('[useLCXL3Device] Cleaning up...');

      if (device) {
        const cleanupFns = (device as any).__cleanupFunctions;
        if (cleanupFns) {
          device.off('device:connected', cleanupFns.handleConnected);
          device.off('device:ready', cleanupFns.handleReady);
          device.off('device:disconnected', cleanupFns.handleDisconnected);
          device.off('device:error', cleanupFns.handleError);
        }
        device.cleanup().catch(console.error);
      }

      if (midiBackend) {
        midiBackend.cleanup().catch(console.error);
      }
    };
  }, []);

  const fetchCurrentMode = async (): Promise<LCXL3CustomMode> => {
    console.log('[fetchCurrentMode] Starting fetch, isConnected:', state.isConnected);
    console.log('[fetchCurrentMode] Device instance:', state.device);
    console.log('[fetchCurrentMode] Device.isConnected():', state.device?.isConnected());

    if (!state.device || !state.isConnected) {
      throw new Error('Device not connected');
    }

    console.log('[fetchCurrentMode] Calling device.loadCustomMode(0)...');
    const mode = await state.device.loadCustomMode(0);
    console.log('[fetchCurrentMode] Mode loaded:', mode);
    return mode;
  };

  return {
    ...state,
    fetchCurrentMode
  };
}