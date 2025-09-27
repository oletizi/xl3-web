import { useState, useCallback } from 'react';
import { CustomMode, ControlMapping } from '@/types/mode';
import { Control } from '@/types/controls';

interface UseModeBuilderOptions {
  initialMode?: CustomMode;
}

export function useModeBuilder(options?: UseModeBuilderOptions) {
  const [mode, setMode] = useState<CustomMode>(options?.initialMode || {
    name: 'Untitled Mode',
    description: '',
    controls: {},
  });

  const [isDirty, setIsDirty] = useState(false);

  const loadMode = useCallback((newMode: CustomMode) => {
    setMode(newMode);
    setIsDirty(false);
  }, []);

  const mapControlIdToMode = (control: Control): string => {
    if (control.type === 'knob') {
      const match = control.id.match(/knob-(\d+)-(\d+)/);
      if (match) {
        const row = parseInt(match[1]);
        const col = parseInt(match[2]);
        const knobLabels = [
          ['SEND_A1', 'SEND_A2', 'SEND_A3', 'SEND_A4', 'SEND_A5', 'SEND_A6', 'SEND_A7', 'SEND_A8'],
          ['SEND_B1', 'SEND_B2', 'SEND_B3', 'SEND_B4', 'SEND_B5', 'SEND_B6', 'SEND_B7', 'SEND_B8'],
          ['PAN1', 'PAN2', 'PAN3', 'PAN4', 'PAN5', 'PAN6', 'PAN7', 'PAN8'],
        ];
        return knobLabels[row - 1]?.[col - 1] || control.id;
      }
    } else if (control.type === 'fader') {
      const match = control.id.match(/fader-(\d+)/);
      if (match) {
        return `FADER${match[1]}`;
      }
    } else if (control.type === 'button') {
      const match = control.id.match(/fader-btn-(\d+)/);
      if (match) {
        return `FOCUS${match[1]}`;
      }
    }
    return control.id;
  };

  const updateControl = useCallback((control: Control, updates: Partial<ControlMapping>) => {
    const controlKey = mapControlIdToMode(control);

    setMode((prev) => {
      const existing = prev.controls[controlKey] || {
        type: control.type,
        channel: control.channel,
        cc: control.ccNumber,
        min: 0,
        max: 127,
        behaviour: 'absolute' as const,
      };

      return {
        ...prev,
        controls: {
          ...prev.controls,
          [controlKey]: {
            ...existing,
            ...updates,
          },
        },
      };
    });

    setIsDirty(true);
  }, []);

  const getControlMapping = useCallback((control: Control): ControlMapping | null => {
    const controlKey = mapControlIdToMode(control);
    return mode.controls[controlKey] || null;
  }, [mode]);

  const updateModeName = useCallback((name: string) => {
    setMode((prev) => ({ ...prev, name }));
    setIsDirty(true);
  }, []);

  const updateModeDescription = useCallback((description: string) => {
    setMode((prev) => ({ ...prev, description }));
    setIsDirty(true);
  }, []);

  const resetMode = useCallback(() => {
    setMode({
      name: 'Untitled Mode',
      description: '',
      controls: {},
    });
    setIsDirty(false);
  }, []);

  const exportMode = useCallback(() => {
    return JSON.stringify(mode, null, 2);
  }, [mode]);

  const importMode = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json);
      if (imported.name && typeof imported.controls === 'object') {
        setMode(imported);
        setIsDirty(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    mode,
    isDirty,
    updateControl,
    getControlMapping,
    updateModeName,
    updateModeDescription,
    resetMode,
    exportMode,
    importMode,
    loadMode,
    markClean,
  };
}