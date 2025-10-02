import React, { createContext, useContext, ReactNode } from 'react';
import { useLCXL3Device as useLCXL3DeviceHook } from '@/hooks/useLCXL3Device';
import type { LCXL3CustomMode } from '@/utils/modeConverter';
import type { LaunchControlXL3 } from '@oletizi/launch-control-xl3';

interface LCXL3ContextType {
  device: LaunchControlXL3 | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchCurrentMode: () => Promise<LCXL3CustomMode>;
}

const LCXL3Context = createContext<LCXL3ContextType | undefined>(undefined);

interface LCXL3ProviderProps {
  children: ReactNode;
}

export function LCXL3Provider({ children }: LCXL3ProviderProps) {
  const deviceState = useLCXL3DeviceHook();

  return (
    <LCXL3Context.Provider value={deviceState}>
      {children}
    </LCXL3Context.Provider>
  );
}

export function useLCXL3Device() {
  const context = useContext(LCXL3Context);
  if (context === undefined) {
    throw new Error('useLCXL3Device must be used within a LCXL3Provider');
  }
  return context;
}