import { useState, useEffect } from 'react';
import { useMIDIDevice } from '@/hooks/useMIDIDevice';
import type { LCXL3CustomMode, LCXL3Control } from '@/utils/modeConverter';

export interface LCXL3DeviceState {
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
}

export function useLCXL3Device() {
  const midiState = useMIDIDevice();

  const [state, setState] = useState<LCXL3DeviceState>({
    isConnected: false,
    isInitialized: false,
    error: null
  });

  useEffect(() => {
    setState({
      isConnected: midiState.isConnected,
      isInitialized: midiState.isInitialized,
      error: midiState.error
    });
  }, [midiState.isConnected, midiState.isInitialized, midiState.error]);

  const fetchCurrentMode = async (): Promise<LCXL3CustomMode> => {
    if (!midiState.xl3Device || !midiState.isConnected) {
      throw new Error('Device not connected');
    }

    throw new Error('Fetch mode not yet implemented - requires SysEx protocol implementation');
  };

  return {
    ...state,
    fetchCurrentMode
  };
}