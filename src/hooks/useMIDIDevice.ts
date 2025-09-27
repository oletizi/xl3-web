import { useState, useEffect } from 'react';
import { MIDIConnectionManager, MIDIDevice } from '@/lib/midi/connection';

export interface MIDIState {
  isSupported: boolean;
  isInitialized: boolean;
  devices: MIDIDevice[];
  xl3Device: MIDIDevice | null;
  error: string | null;
}

export function useMIDIDevice() {
  const [state, setState] = useState<MIDIState>({
    isSupported: false,
    isInitialized: false,
    devices: [],
    xl3Device: null,
    error: null,
  });

  useEffect(() => {
    const isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'WebMIDI is not supported in this browser. Please use Chrome or Edge.',
      }));
      return;
    }

    const manager = new MIDIConnectionManager();

    manager
      .initialize()
      .then(() => {
        setState((prev) => ({ ...prev, isInitialized: true, error: null }));

        const unsubscribe = manager.onDeviceChange((devices) => {
          const xl3Device = manager.findLaunchControlXL3();
          setState((prev) => ({
            ...prev,
            devices,
            xl3Device,
          }));
        });

        return unsubscribe;
      })
      .catch((error) => {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize MIDI',
        }));
      });

    return () => {
      manager.dispose();
    };
  }, []);

  return state;
}