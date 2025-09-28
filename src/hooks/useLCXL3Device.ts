import { useState, useEffect } from 'react';
import { LaunchControlXL3 } from '@oletizi/launch-control-xl3';
import type { LCXL3CustomMode } from '@/utils/modeConverter';

export interface LCXL3DeviceState {
  device: LaunchControlXL3 | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
}

export function useLCXL3Device() {
  // Create device instance once (following library README pattern)
  const [device] = useState(() => {
    console.log('[useLCXL3Device] Creating LaunchControlXL3 instance');
    return new LaunchControlXL3({
      autoConnect: true,
      enableCustomModes: true,
      enableLedControl: false
    });
  });

  const [state, setState] = useState<LCXL3DeviceState>({
    device,
    isConnected: false,
    isInitialized: false,
    error: null
  });

  useEffect(() => {
    console.log('[useLCXL3Device] Setting up event listeners');

    const handleConnected = () => {
      console.log('[useLCXL3Device] Device connected event');
      setState(prev => ({ ...prev, isConnected: true }));
    };

    const handleReady = () => {
      console.log('[useLCXL3Device] Device ready event');
      setState(prev => ({ ...prev, isConnected: true }));
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

    device.on('device:connected', handleConnected);
    device.on('device:ready', handleReady);
    device.on('device:disconnected', handleDisconnected);
    device.on('device:error', handleError);

    const initDevice = async () => {
      try {
        console.log('[useLCXL3Device] Initializing device...');
        await device.initialize();
        console.log('[useLCXL3Device] Device initialized, isConnected:', device.isConnected());

        setState(prev => ({
          ...prev,
          isConnected: device.isConnected(),
          isInitialized: true,
          error: null
        }));
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
      console.log('[useLCXL3Device] Cleaning up');
      device.off('device:connected', handleConnected);
      device.off('device:ready', handleReady);
      device.off('device:disconnected', handleDisconnected);
      device.off('device:error', handleError);
      device.cleanup().catch(console.error);
    };
  }, [device]);

  const fetchCurrentMode = async (): Promise<LCXL3CustomMode> => {
    console.log('[fetchCurrentMode] Starting fetch, isConnected:', state.isConnected);
    console.log('[fetchCurrentMode] Device instance:', device);
    console.log('[fetchCurrentMode] Device.isConnected():', device?.isConnected());

    if (!device || !state.isConnected) {
      throw new Error('Device not connected');
    }

    console.log('[fetchCurrentMode] Calling device.loadCustomMode(0)...');
    const mode = await device.loadCustomMode(0);
    console.log('[fetchCurrentMode] Mode loaded:', mode);
    return mode;
  };

  return {
    ...state,
    fetchCurrentMode
  };
}