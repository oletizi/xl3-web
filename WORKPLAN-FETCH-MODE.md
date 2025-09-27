# Fetch Mode from Device Implementation Workplan

**Status**: 🟡 IN PROGRESS
**Date**: 2025-09-27
**Feature**: Feature 6.0 & 6.1 - Send and Receive Modes to and from Device (Fetch Only)

## Specification Requirements (docs/EDITOR-SPECIFICATION.md)

### Feature 6.0: Send and Fetch controls are sensitive to the connection status of the device
- [ ] When the device is not attached, the Send and fetch buttons are inactive

### Feature 6.1: Users can retrieve the current mode from the device into the edit buffer
- [ ] There is a button to the left of the "Send" button labeled "Fetch"
- [ ] When the user clicks the "Fetch" button, the system initiates a MIDI transfer of the data in the currently active mode in the device
- [ ] The system resets the current edit buffer to factory defaults, then applies the fetched mode data to the current edit buffer
- [ ] Per standard operation, the UI is updated to reflect the new state of the edit buffer
- [ ] The UI indicates the success or failure of the fetch action

## Current State Analysis

### What EXISTS:
- ✅ @oletizi/launch-control-xl3 package (v1.0.12) with LaunchControlXL3 class
- ✅ MIDIConnectionManager for basic MIDI connection (Feature 1)
- ✅ useMIDIDevice hook that tracks connection state
- ✅ Editor page with mode state and Send button
- ✅ initializeDefaultControls() for creating default mode
- ✅ Toast notifications for user feedback

### What is MISSING:
- ❌ Integration of LaunchControlXL3 library in the app
- ❌ Service/hook to manage LCXL3 device instance
- ❌ Fetch button in UI
- ❌ Handler to fetch mode from device
- ❌ Conversion from LCXL3 mode format to our CustomMode format
- ❌ Logic to reset buffer to defaults before applying fetched data
- ❌ Disabled state for Fetch/Send buttons when disconnected

## Implementation Tasks

### Task 1: Create LCXL3 Service Hook
**File**: Create `src/hooks/useLCXL3Device.ts`

**What to implement**:
A React hook that manages the LaunchControlXL3 device instance with Web MIDI backend.

```typescript
import { useState, useEffect, useRef } from 'react';
import { LaunchControlXL3 } from '@oletizi/launch-control-xl3';

export interface LCXL3DeviceState {
  device: LaunchControlXL3 | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface LCXL3CustomMode {
  name: string;
  controls: Record<string, {
    type: 'knob' | 'fader' | 'button';
    channel: number;
    cc: number;
    min: number;
    max: number;
    behaviour?: string;
  }>;
  leds?: Map<number, { color: string; behaviour: string }>;
  metadata?: {
    slot: number;
    createdAt: Date;
    modifiedAt: Date;
  };
}

export function useLCXL3Device() {
  const [state, setState] = useState<LCXL3DeviceState>({
    device: null,
    isConnected: false,
    isInitialized: false,
    error: null
  });

  const deviceRef = useRef<LaunchControlXL3 | null>(null);

  useEffect(() => {
    const initDevice = async () => {
      try {
        const device = new LaunchControlXL3({
          autoConnect: true,
          enableCustomModes: true,
          enableLedControl: false
        });

        device.on('device:ready', () => {
          setState(prev => ({ ...prev, isConnected: true }));
        });

        device.on('device:error', (error) => {
          setState(prev => ({
            ...prev,
            error: error.message || 'Device error',
            isConnected: false
          }));
        });

        await device.initialize();
        deviceRef.current = device;

        setState({
          device,
          isConnected: true,
          isInitialized: true,
          error: null
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize device',
          isInitialized: true
        }));
      }
    };

    initDevice();

    return () => {
      if (deviceRef.current) {
        deviceRef.current.disconnect().catch(console.error);
      }
    };
  }, []);

  const fetchCurrentMode = async (): Promise<LCXL3CustomMode> => {
    if (!state.device || !state.isConnected) {
      throw new Error('Device not connected');
    }

    // Slot 0 is the currently active custom mode
    const mode = await state.device.loadCustomMode(0);
    return mode;
  };

  return {
    ...state,
    fetchCurrentMode
  };
}
```

**Success criteria**:
- Hook initializes LaunchControlXL3 device on mount
- Tracks connection state
- Provides fetchCurrentMode function
- Handles errors gracefully

---

### Task 2: Convert LCXL3 Mode to CustomMode Format
**File**: Create `src/utils/modeConverter.ts`

**What to implement**:
Utility functions to convert between LCXL3 mode format and our CustomMode format.

```typescript
import type { CustomMode, ControlMapping } from '@/types/mode';
import type { LCXL3CustomMode } from '@/hooks/useLCXL3Device';
import { CONTROL_IDS } from '@/utils/controlMetadata';

// Map LCXL3 control IDs to our control IDs
const CONTROL_ID_MAP: Record<string, string> = {
  'knob1': 'knob-cc13',
  'knob2': 'knob-cc14',
  'knob3': 'knob-cc15',
  // ... add all 48 mappings
  'fader1': 'fader-cc5',
  'fader2': 'fader-cc6',
  // ...
  'button1': 'button-cc37',
  'button2': 'button-cc38',
  // ...
};

export function lcxl3ModeToCustomMode(lcxl3Mode: LCXL3CustomMode): CustomMode {
  const controls: Record<string, ControlMapping> = {};

  for (const [lcxl3ControlId, control] of Object.entries(lcxl3Mode.controls)) {
    const ourControlId = CONTROL_ID_MAP[lcxl3ControlId];
    if (!ourControlId) {
      console.warn(`Unknown control ID: ${lcxl3ControlId}`);
      continue;
    }

    controls[ourControlId] = {
      id: ourControlId,
      type: control.type,
      ccNumber: control.cc,
      midiChannel: control.channel,
      minValue: control.min,
      maxValue: control.max,
      label: '' // No label in LCXL3 mode, will use default
    };
  }

  return {
    name: lcxl3Mode.name || 'Fetched Mode',
    description: `Fetched from device on ${new Date().toLocaleString()}`,
    version: '1.0.0',
    controls,
    createdAt: lcxl3Mode.metadata?.createdAt.toISOString() || new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
}
```

**Success criteria**:
- Converts all 48 controls from LCXL3 format to CustomMode format
- Handles missing controls gracefully
- Preserves control metadata (CC numbers, channels, ranges)

---

### Task 3: Add Fetch Button to Editor UI
**File**: Modify `src/pages/Editor.tsx`

**Changes needed**:
1. Import useLCXL3Device hook
2. Add Fetch button to UI (before Send button)
3. Create handleFetch function
4. Disable Fetch/Send buttons when not connected
5. Show toast notifications for success/failure

**Example implementation**:
```typescript
import { useLCXL3Device } from '@/hooks/useLCXL3Device';
import { lcxl3ModeToCustomMode } from '@/utils/modeConverter';
import { Download } from "lucide-react";

// In Editor component:
const { isConnected: lcxl3Connected, fetchCurrentMode } = useLCXL3Device();

const handleFetch = async () => {
  try {
    toast.info('Fetching mode from device...');

    const lcxl3Mode = await fetchCurrentMode();
    const fetchedMode = lcxl3ModeToCustomMode(lcxl3Mode);

    // Reset to defaults first, then apply fetched data
    const defaultControls = initializeDefaultControls();
    const mergedControls = {
      ...defaultControls,
      ...fetchedMode.controls
    };

    setMode({
      ...fetchedMode,
      controls: mergedControls
    });

    toast.success('Mode fetched successfully from device!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch mode';
    toast.error(`Fetch failed: ${message}`);
    console.error('Fetch error:', error);
  }
};

// In JSX (before Send button):
<Button
  onClick={handleFetch}
  disabled={!lcxl3Connected}
  size="sm"
  className="bg-accent text-accent-foreground shadow-glow-accent"
>
  <Download className="w-4 h-4 mr-2" />
  Fetch
</Button>
<Button
  disabled={!lcxl3Connected}
  size="sm"
  className="bg-secondary text-secondary-foreground shadow-glow-secondary"
>
  <Play className="w-4 h-4 mr-2" />
  Send
</Button>
```

**Success criteria**:
- Fetch button appears before Send button
- Both buttons disabled when device not connected
- Clicking Fetch initiates mode transfer
- Success/failure toasts appear
- UI updates with fetched mode data

---

### Task 4: Build Complete Control ID Mapping
**File**: Update `src/utils/modeConverter.ts`

**What to implement**:
Complete the CONTROL_ID_MAP with all 48 controls based on LCXL3 library's control naming.

**Research needed**:
Check LaunchControlXL3.CONTROL_IDS to get exact control names from the library.

**Success criteria**:
- All 24 knobs mapped
- All 8 faders mapped
- All 16 buttons mapped
- Mapping verified against library constants

---

### Task 5: Verification with Playwright MCP

**Test Scenarios**:

**Test 1: Fetch button disabled when no device**
1. Navigate to http://localhost:8081/
2. Without device connected
3. Verify Fetch button is disabled
4. Verify Send button is disabled

**Test 2: Fetch button enabled when connected**
1. Connect LCXL3 hardware
2. Navigate to http://localhost:8081/
3. Wait for connection indicator to show "Connected"
4. Verify Fetch button is enabled
5. Verify Send button is enabled

**Test 3: Fetch mode from device (requires hardware)**
1. With LCXL3 connected
2. Configure a custom mode on the device (change some CC mappings)
3. Click Fetch button
4. Verify toast shows "Fetching mode from device..."
5. Verify toast shows success message
6. Verify editor shows fetched mode name
7. Click on controls and verify fetched CC mappings appear in properties

**Test 4: Fetch handles errors gracefully**
1. With LCXL3 connected
2. Disconnect device during fetch operation
3. Verify error toast appears
4. Verify app doesn't crash

**Success criteria**:
- All tests pass
- Fetch button correctly reflects connection state
- Mode fetching works with real hardware
- Errors handled gracefully

---

### Task 6: Write E2E Test
**File**: Create `tests/e2e/feature-6-fetch-mode.spec.ts`

**Note**: Since Feature 6.1 requires actual MIDI hardware, E2E tests will be limited to:
- UI state verification (button disabled/enabled based on mock connection)
- Error handling
- Toast notifications

Full integration testing will require hardware.

**Test Coverage**:
1. Fetch button exists in correct position
2. Fetch button disabled when disconnected
3. Fetch button enabled when connected (mocked)
4. Click Fetch shows appropriate toast
5. Error handling shows error toast

**Success criteria**:
- E2E tests pass across 3 browsers
- Test coverage for UI behavior
- Note documented that full test requires hardware

---

## Implementation Order

1. **Task 2** - Create mode converter utility (no dependencies)
2. **Task 4** - Build complete control ID mapping
3. **Task 1** - Create LCXL3 service hook
4. **Task 3** - Add Fetch button to UI
5. **Task 5** - Verify with Playwright MCP (requires hardware)
6. **Task 6** - Write E2E test

## Testing Approach

### Manual Testing with Hardware:

1. Connect LCXL3 device via USB
2. Open editor at http://localhost:8081/
3. Wait for connection indicator to show connected
4. Configure device to custom mode with specific settings
5. Click Fetch button
6. Verify fetched mode data appears in editor
7. Verify CC mappings match device configuration

### Without Hardware:

- Test UI state (buttons disabled/enabled)
- Test error handling
- Test toast notifications
- Verify TypeScript types compile

---

## Notes

- **Hardware Dependency**: Full feature testing requires physical LCXL3 hardware
- **Slot Selection**: Currently fetches slot 0 (active mode). Future enhancement could allow slot selection.
- **Send Feature (6.2)**: Not implemented in this workplan. Will be separate implementation.
- **Library Integration**: Uses @oletizi/launch-control-xl3 v1.0.12 which provides comprehensive MIDI SysEx support

---

**Next Step**: Begin Task 2 (Create mode converter utility)