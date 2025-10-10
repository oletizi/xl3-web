# Slot Management UI Implementation Workplan

**Status**: 🔵 PLANNED
**Date**: 2025-10-09
**Feature**: Multi-Slot Mode Management and Synchronization

## Overview

The Launch Control XL3 hardware has 15 memory slots (indexed 0-14) for storing custom modes. Currently, the editor only interacts with slot 0. This workplan outlines the implementation of a comprehensive slot management UI that allows users to:

1. View all 15 slot names from the connected device
2. Select which slot is "active" for Fetch/Send operations
3. See sync status between the edit buffer and active device slot
4. Persist the active slot selection across sessions

## Specification Requirements

### User Stories

**US-1**: As a user, I want to see the names of all modes stored in my device's 15 slots, so I can understand what's available without cycling through them on the hardware.

**US-2**: As a user, I want to click on a slot to select it as "active", so that Fetch and Send operations target the slot I'm working with.

**US-3**: As a user, I want to see whether my current edit buffer matches what's in the active slot on the device, so I know if I have unsaved changes.

**US-4**: As a user, I want my active slot selection to persist across browser sessions, so I can continue where I left off.

**US-5**: As a user, I want the slot UI to appear above the device visualization, so it's clear which mode I'm working with.

### Functional Requirements

#### FR-1: Slot Display
- Display all 15 slots (0-14) with their names from the connected device
- Show slot index and name (e.g., "0: FACTORY", "1: CHANNEVE", "2: MY MODE")
- Slots should be horizontally scrollable if they don't fit on screen
- If device not connected, show placeholders (e.g., "0: ---", "1: ---")

#### FR-2: Slot Selection
- User can click on any slot to make it the "active" slot
- Active slot is visually distinguished (highlight, border, etc.)
- Only one slot can be active at a time

#### FR-3: Fetch/Send Integration
- `handleFetch()` should load from the active slot (not hardcoded slot 0)
- `handleSend()` should save to the active slot (not hardcoded slot 0)
- When device disconnects, active slot remains selected (for persistence)

#### FR-4: Sync Status
- Compare edit buffer hash with hash of mode in active device slot
- Show sync indicator on active slot:
  - ✅ Green checkmark: Edit buffer matches device slot
  - ⚠️ Orange warning: Edit buffer differs from device slot
  - 🔄 Blue sync icon: Currently syncing (during Fetch/Send)
  - ❓ Gray question: Device not connected (sync unknown)

#### FR-5: Persistence
- Active slot index saved to localStorage
- Active slot restored on page load
- Edit buffer already persists (via existing `statePersistence.ts`)

#### FR-6: UI Layout
- Slot selector appears above the controller visualization
- Responsive design: horizontal scroll on mobile, grid on desktop
- Minimum touch target size for mobile (44px)

## Current State Analysis

### What EXISTS

✅ Device connection management (`useLCXL3Device`)
✅ `device.loadCustomMode(slotIndex)` method
✅ `device.saveCustomMode(slotIndex, mode)` method
✅ Edit buffer state management (`mode` in Editor.tsx)
✅ LocalStorage persistence (`statePersistence.ts`)
✅ Toast notifications for user feedback
✅ Mode converter (`modeConverter.ts`)

### What is MISSING

❌ UI component to display 15 slots
❌ Method to fetch all slot names from device
❌ Active slot state management
❌ Sync status detection logic
❌ LocalStorage for active slot persistence
❌ Integration of active slot into Fetch/Send handlers
❌ Slot name display and selection UI
❌ Sync indicator visual component

## Architecture & Design

### State Management

```typescript
interface SlotState {
  activeSlotIndex: number;        // 0-14, which slot is selected
  slotNames: string[];            // Array of 15 slot names from device
  syncStatus: SyncStatus;         // Sync state of active slot
  isLoadingSlots: boolean;        // Fetching slot names from device
}

type SyncStatus =
  | 'synced'        // Edit buffer matches device slot
  | 'modified'      // Edit buffer differs from device
  | 'syncing'       // Currently fetching/sending
  | 'unknown';      // Device not connected or not checked
```

### Component Hierarchy

```
Editor (page)
├── SlotSelector (new component)
│   ├── SlotList
│   │   └── SlotCard × 15
│   │       ├── SlotIndex ("0", "1", ...)
│   │       ├── SlotName ("FACTORY", "MY MODE", ...)
│   │       └── SyncIndicator (✅ ⚠️ 🔄 ❓)
│   └── RefreshButton (fetch slot names)
├── ControllerVisual (existing)
└── PropertiesPanel (existing)
```

### Data Flow

1. **On Mount / Device Connect**:
   - Load `activeSlotIndex` from localStorage (default: 0)
   - Fetch all 15 slot names from device (if connected)
   - Load edit buffer from localStorage
   - Compare edit buffer with active slot → determine sync status

2. **User Clicks Slot**:
   - Update `activeSlotIndex` state
   - Save to localStorage
   - Re-compute sync status for new active slot

3. **User Clicks Fetch**:
   - Set sync status to 'syncing'
   - Call `device.loadCustomMode(activeSlotIndex)`
   - Update edit buffer with fetched mode
   - Set sync status to 'synced' (buffer now matches device)

4. **User Clicks Send**:
   - Set sync status to 'syncing'
   - Call `device.saveCustomMode(activeSlotIndex, mode)`
   - Set sync status to 'synced' (device now matches buffer)

5. **User Edits Mode**:
   - Edit buffer changes (existing behavior)
   - Set sync status to 'modified' (buffer no longer matches device)

6. **Device Disconnects**:
   - Set sync status to 'unknown'
   - Keep slot names cached (last known state)
   - Keep active slot selected

### Sync Detection Algorithm

**Challenge**: How to detect if edit buffer matches device slot?

**Option A - Simple Hash Comparison** (Recommended):
```typescript
async function checkSyncStatus(
  editBuffer: CustomMode,
  activeSlot: number,
  device: LaunchControlXL3 | null
): Promise<SyncStatus> {
  if (!device) return 'unknown';

  try {
    const deviceMode = await device.loadCustomMode(activeSlot);
    const deviceModeConverted = lcxl3ModeToCustomMode(deviceMode);

    // Compare critical fields (ignore timestamps)
    const editHash = hashMode(editBuffer);
    const deviceHash = hashMode(deviceModeConverted);

    return editHash === deviceHash ? 'synced' : 'modified';
  } catch (error) {
    return 'unknown';
  }
}

function hashMode(mode: CustomMode): string {
  // Hash only the control mappings, ignore name/description/timestamps
  const controlsJson = JSON.stringify(mode.controls);
  return simpleHash(controlsJson);
}
```

**Option B - Optimistic Status Tracking**:
- On Fetch: Set status to 'synced'
- On Send: Set status to 'synced'
- On Edit: Set status to 'modified'
- On Slot Change: Check via Option A

**Recommendation**: Use Option B for performance, Option A as fallback when switching slots.

## Implementation Tasks

---

### Task 1: Create Slot Persistence Utilities

**File**: `src/utils/slotPersistence.ts`

**What to implement**:
LocalStorage utilities for persisting active slot and cached slot names.

```typescript
const ACTIVE_SLOT_KEY = 'lcxl3-active-slot';
const SLOT_NAMES_KEY = 'lcxl3-slot-names';

export function saveActiveSlot(slotIndex: number): void {
  if (slotIndex < 0 || slotIndex > 14) {
    throw new Error(`Invalid slot index: ${slotIndex}`);
  }
  localStorage.setItem(ACTIVE_SLOT_KEY, String(slotIndex));
}

export function loadActiveSlot(): number {
  const stored = localStorage.getItem(ACTIVE_SLOT_KEY);
  const parsed = parseInt(stored || '0', 10);

  if (isNaN(parsed) || parsed < 0 || parsed > 14) {
    return 0; // Default to slot 0
  }

  return parsed;
}

export function saveSlotNames(names: string[]): void {
  if (names.length !== 15) {
    throw new Error(`Expected 15 slot names, got ${names.length}`);
  }
  localStorage.setItem(SLOT_NAMES_KEY, JSON.stringify(names));
}

export function loadSlotNames(): string[] | null {
  const stored = localStorage.getItem(SLOT_NAMES_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length === 15) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSlotData(): void {
  localStorage.removeItem(ACTIVE_SLOT_KEY);
  localStorage.removeItem(SLOT_NAMES_KEY);
}
```

**Success criteria**:
- Functions handle valid ranges (0-14)
- Invalid data returns sensible defaults
- TypeScript types are correct

---

### Task 2: Add Slot Management to Device Hook

**File**: Modify `src/hooks/useLCXL3Device.ts`

**Changes needed**:
Add methods to fetch all slot names from the device.

```typescript
// Add to return value of useLCXL3Device
return {
  ...state,
  fetchCurrentMode,
  fetchAllSlotNames,  // NEW
};

// New function
const fetchAllSlotNames = async (): Promise<string[]> => {
  if (!state.device || !state.isConnected) {
    throw new Error('Device not connected');
  }

  const names: string[] = [];

  // Load each slot and extract its name
  for (let i = 0; i < 15; i++) {
    try {
      const mode = await state.device.loadCustomMode(i);
      names.push(mode.name || `Slot ${i}`);
    } catch (error) {
      console.warn(`Failed to load slot ${i}:`, error);
      names.push(`Slot ${i}`); // Fallback name
    }
  }

  return names;
};
```

**Performance consideration**:
- Fetching 15 slots sequentially may take time (~1-2 seconds)
- Show loading indicator during fetch
- Cache results and only refresh on user request

**Success criteria**:
- Returns array of 15 slot names
- Handles errors gracefully (fallback names)
- Does not block UI

---

### Task 3: Create Sync Status Utilities

**File**: `src/utils/syncDetection.ts`

**What to implement**:
Logic to detect if edit buffer matches a device slot.

```typescript
import type { CustomMode } from '@/types/mode';
import type { LCXL3CustomMode } from '@/utils/modeConverter';
import { lcxl3ModeToCustomMode } from '@/utils/modeConverter';

/**
 * Simple hash function for mode data
 */
function hashMode(mode: CustomMode): string {
  // Create a stable representation of controls only
  const controlsKeys = Object.keys(mode.controls).sort();
  const controlsData = controlsKeys.map(key => {
    const c = mode.controls[key];
    return `${key}:${c.ccNumber}:${c.midiChannel}:${c.minValue}:${c.maxValue}`;
  }).join('|');

  // Simple hash (not cryptographic, just for comparison)
  let hash = 0;
  for (let i = 0; i < controlsData.length; i++) {
    const char = controlsData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Compare two modes for equality (ignoring timestamps/metadata)
 */
export function modesAreEqual(a: CustomMode, b: CustomMode): boolean {
  return hashMode(a) === hashMode(b);
}

/**
 * Check if edit buffer matches device slot
 */
export async function checkSlotSync(
  editBuffer: CustomMode,
  deviceMode: LCXL3CustomMode
): Promise<boolean> {
  const convertedDeviceMode = lcxl3ModeToCustomMode(deviceMode);
  return modesAreEqual(editBuffer, convertedDeviceMode);
}
```

**Success criteria**:
- Hash function is deterministic
- Ignores timestamps and metadata
- Focuses on control mappings
- Fast comparison (< 10ms)

---

### Task 4: Create SlotCard Component

**File**: `src/components/editor/SlotCard.tsx`

**What to implement**:
Individual slot display component with sync indicator.

```typescript
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SyncStatus = 'synced' | 'modified' | 'syncing' | 'unknown';

interface SlotCardProps {
  slotIndex: number;
  slotName: string;
  isActive: boolean;
  syncStatus: SyncStatus;
  onClick: () => void;
}

export function SlotCard({
  slotIndex,
  slotName,
  isActive,
  syncStatus,
  onClick
}: SlotCardProps) {
  const syncIcon = {
    synced: <Check className="w-4 h-4 text-green-500" />,
    modified: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    syncing: <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />,
    unknown: <HelpCircle className="w-4 h-4 text-gray-400" />
  }[syncStatus];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-3 cursor-pointer',
        'min-w-[80px] transition-all hover:shadow-md',
        isActive && 'ring-2 ring-primary shadow-glow-primary'
      )}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">
          {slotIndex}
        </Badge>
        {isActive && syncIcon}
      </div>
      <span className="text-sm font-medium text-center line-clamp-1">
        {slotName}
      </span>
    </Card>
  );
}
```

**Success criteria**:
- Shows slot index and name
- Visual distinction for active slot
- Sync indicator only on active slot
- Accessible (keyboard navigation, ARIA labels)
- Responsive (mobile-friendly touch targets)

---

### Task 5: Create SlotSelector Component

**File**: `src/components/editor/SlotSelector.tsx`

**What to implement**:
Container component that manages all 15 slots.

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { SlotCard, SyncStatus } from './SlotCard';
import { cn } from '@/lib/utils';

interface SlotSelectorProps {
  slotNames: string[];
  activeSlotIndex: number;
  syncStatus: SyncStatus;
  onSlotSelect: (index: number) => void;
  onRefreshSlots: () => void;
  isLoadingSlots: boolean;
  isDeviceConnected: boolean;
}

export function SlotSelector({
  slotNames,
  activeSlotIndex,
  syncStatus,
  onSlotSelect,
  onRefreshSlots,
  isLoadingSlots,
  isDeviceConnected
}: SlotSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Device Slots
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshSlots}
          disabled={!isDeviceConnected || isLoadingSlots}
        >
          <RefreshCw className={cn(
            'w-4 h-4 mr-2',
            isLoadingSlots && 'animate-spin'
          )} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {slotNames.map((name, index) => (
          <SlotCard
            key={index}
            slotIndex={index}
            slotName={name}
            isActive={index === activeSlotIndex}
            syncStatus={index === activeSlotIndex ? syncStatus : 'unknown'}
            onClick={() => onSlotSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Success criteria**:
- Displays all 15 slots in horizontal scrollable layout
- Refresh button fetches latest slot names
- Disabled when device not connected
- Shows loading state during refresh

---

### Task 6: Integrate Slots into Editor

**File**: Modify `src/pages/Editor.tsx`

**Changes needed**:
1. Import slot components and utilities
2. Add slot state management
3. Update Fetch/Send handlers to use active slot
4. Add slot change handler with sync detection
5. Add SlotSelector to JSX above ControllerVisual

```typescript
import { SlotSelector } from '@/components/editor/SlotSelector';
import { saveActiveSlot, loadActiveSlot, saveSlotNames, loadSlotNames } from '@/utils/slotPersistence';
import { modesAreEqual } from '@/utils/syncDetection';
import type { SyncStatus } from '@/components/editor/SlotCard';

// Add state
const [activeSlotIndex, setActiveSlotIndex] = useState<number>(() => loadActiveSlot());
const [slotNames, setSlotNames] = useState<string[]>(() => {
  const cached = loadSlotNames();
  return cached || Array.from({ length: 15 }, (_, i) => `Slot ${i}`);
});
const [syncStatus, setSyncStatus] = useState<SyncStatus>('unknown');
const [isLoadingSlots, setIsLoadingSlots] = useState(false);

// Fetch all slot names from device
const handleRefreshSlots = async () => {
  if (!device || !lcxl3Connected) return;

  setIsLoadingSlots(true);
  try {
    const names = await device.fetchAllSlotNames(); // Need to add this method
    setSlotNames(names);
    saveSlotNames(names);
    toast.success('Slot names refreshed');
  } catch (error) {
    toast.error('Failed to fetch slot names');
    console.error(error);
  } finally {
    setIsLoadingSlots(false);
  }
};

// Handle slot selection
const handleSlotSelect = async (index: number) => {
  setActiveSlotIndex(index);
  saveActiveSlot(index);

  // Check sync status for new slot
  if (device && lcxl3Connected) {
    try {
      setSyncStatus('syncing');
      const deviceMode = await device.loadCustomMode(index);
      const isSync = await checkSlotSync(mode, deviceMode);
      setSyncStatus(isSync ? 'synced' : 'modified');
    } catch {
      setSyncStatus('unknown');
    }
  }
};

// Update handleFetch to use active slot
const handleFetch = async () => {
  try {
    setSyncStatus('syncing');
    toast.info(`Fetching mode from slot ${activeSlotIndex}...`);

    const lcxl3Mode = await device.loadCustomMode(activeSlotIndex); // Changed from 0
    const fetchedMode = lcxl3ModeToCustomMode(lcxl3Mode);

    // ... existing merge logic ...

    setMode({
      ...fetchedMode,
      controls: mergedControls
    });

    setSyncStatus('synced'); // Now in sync
    toast.success('Mode fetched successfully from device!');
  } catch (error) {
    setSyncStatus('unknown');
    // ... existing error handling ...
  }
};

// Update handleSend to use active slot
const handleSend = async () => {
  if (!device) {
    toast.error('Device not connected');
    return;
  }

  try {
    setSyncStatus('syncing');
    toast.info(`Sending mode to slot ${activeSlotIndex}...`);

    const lcxl3Mode = customModeToLCXL3Mode(mode);
    await device.saveCustomMode(activeSlotIndex, lcxl3Mode); // Changed from 0

    setSyncStatus('synced'); // Now in sync
    toast.success('Mode sent successfully to device!');
  } catch (error) {
    setSyncStatus('unknown');
    // ... existing error handling ...
  }
};

// Track edit buffer changes
useEffect(() => {
  // Existing save to localStorage
  saveModeToStorage(mode);

  // Mark as modified when buffer changes (unless we just fetched/sent)
  if (syncStatus === 'synced') {
    setSyncStatus('modified');
  }
}, [mode]);

// Add SlotSelector to JSX (above ControllerVisual)
<div className="xl:col-span-3 space-y-6">
  {/* Slot Selector */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Card className="p-6 bg-gradient-surface border-border/50">
      <SlotSelector
        slotNames={slotNames}
        activeSlotIndex={activeSlotIndex}
        syncStatus={syncStatus}
        onSlotSelect={handleSlotSelect}
        onRefreshSlots={handleRefreshSlots}
        isLoadingSlots={isLoadingSlots}
        isDeviceConnected={lcxl3Connected}
      />
    </Card>
  </motion.div>

  {/* Controller Visual */}
  <motion.div ...>
    <Card className="p-8 bg-gradient-surface border-border/50">
      <ControllerVisual ... />
    </Card>
  </motion.div>
</div>
```

**Success criteria**:
- Slot selector appears above controller visual
- Active slot persists across page reloads
- Fetch/Send use active slot
- Sync status updates correctly
- Edit buffer changes mark as modified

---

### Task 7: Add fetchAllSlotNames to Device Hook

**File**: Modify `src/hooks/useLCXL3Device.ts`

**What to implement**:
Export the `fetchAllSlotNames` function from the hook (already outlined in Task 2).

**Implementation**:
```typescript
const fetchAllSlotNames = async (): Promise<string[]> => {
  if (!state.device || !state.isConnected) {
    throw new Error('Device not connected');
  }

  const names: string[] = [];

  for (let i = 0; i < 15; i++) {
    try {
      const mode = await state.device.loadCustomMode(i);
      names.push(mode.name || `Slot ${i}`);
    } catch (error) {
      console.warn(`Failed to load slot ${i}:`, error);
      names.push(`---`); // Empty slot indicator
    }
  }

  return names;
};

return {
  ...state,
  fetchCurrentMode,
  fetchAllSlotNames // Add to exports
};
```

**Success criteria**:
- Loads all 15 slot names sequentially
- Handles errors gracefully (fallback names)
- Returns array of exactly 15 strings

---

### Task 8: Update LCXL3Context Interface

**File**: Modify `src/contexts/LCXL3Context.tsx`

**What to change**:
Add `fetchAllSlotNames` to context interface.

```typescript
interface LCXL3ContextType {
  device: LaunchControlXL3 | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchCurrentMode: () => Promise<LCXL3CustomMode>;
  fetchAllSlotNames: () => Promise<string[]>; // NEW
}
```

**Success criteria**:
- TypeScript compilation succeeds
- Context provides new method

---

### Task 9: Optimize Sync Detection

**File**: Modify `src/utils/syncDetection.ts`

**What to add**:
Optimistic sync tracking to avoid excessive device reads.

```typescript
/**
 * Sync tracker that uses optimistic updates
 */
export class SyncTracker {
  private lastKnownDeviceHash: string | null = null;
  private lastEditBufferHash: string | null = null;

  /**
   * Mark that we just fetched from device
   */
  markFetched(mode: CustomMode): void {
    const hash = hashMode(mode);
    this.lastKnownDeviceHash = hash;
    this.lastEditBufferHash = hash;
  }

  /**
   * Mark that we just sent to device
   */
  markSent(mode: CustomMode): void {
    const hash = hashMode(mode);
    this.lastKnownDeviceHash = hash;
    this.lastEditBufferHash = hash;
  }

  /**
   * Mark that edit buffer changed
   */
  markEdited(mode: CustomMode): void {
    this.lastEditBufferHash = hashMode(mode);
  }

  /**
   * Get sync status without device read
   */
  getOptimisticStatus(): SyncStatus {
    if (this.lastKnownDeviceHash === null) return 'unknown';
    if (this.lastEditBufferHash === null) return 'unknown';

    return this.lastKnownDeviceHash === this.lastEditBufferHash
      ? 'synced'
      : 'modified';
  }

  /**
   * Reset tracker (e.g., when switching slots)
   */
  reset(): void {
    this.lastKnownDeviceHash = null;
    this.lastEditBufferHash = null;
  }
}
```

**Usage in Editor**:
```typescript
const syncTracker = useRef(new SyncTracker());

// After fetch
syncTracker.current.markFetched(fetchedMode);
setSyncStatus('synced');

// After send
syncTracker.current.markSent(mode);
setSyncStatus('synced');

// After edit
syncTracker.current.markEdited(mode);
setSyncStatus(syncTracker.current.getOptimisticStatus());

// On slot change
syncTracker.current.reset();
// ... then do actual sync check
```

**Success criteria**:
- Avoids unnecessary device reads
- Maintains accurate sync status
- Resets properly on slot change

---

## Implementation Order

1. **Task 1** - Slot persistence utilities (no dependencies)
2. **Task 3** - Sync detection utilities (no dependencies)
3. **Task 7** - Add `fetchAllSlotNames` to device hook
4. **Task 8** - Update LCXL3Context interface
5. **Task 4** - Create SlotCard component
6. **Task 5** - Create SlotSelector component
7. **Task 9** - Optimize sync detection (optional enhancement)
8. **Task 6** - Integrate into Editor (depends on all above)

## Testing Strategy

### Unit Tests

**Test Suite**: `slotPersistence.test.ts`
- Save/load active slot
- Handle invalid slot indices
- Save/load slot names array
- Handle corrupted localStorage data

**Test Suite**: `syncDetection.test.ts`
- Hash function determinism
- Mode equality comparison
- Ignore timestamp differences
- Detect control mapping changes

### Integration Tests

**Test Suite**: `SlotSelector.test.tsx`
- Renders 15 slots
- Click to select slot
- Shows active slot highlight
- Shows sync indicator on active slot only
- Refresh button fetches slot names
- Disabled state when device disconnected

### E2E Tests (Playwright)

**Test 1: Slot Selection Persists**
1. Navigate to editor
2. Select slot 5
3. Reload page
4. Verify slot 5 is still active

**Test 2: Fetch Uses Active Slot**
1. Select slot 3
2. Click Fetch
3. Verify toast says "Fetching from slot 3"

**Test 3: Sync Status Updates**
1. Fetch mode (sync status = ✅ synced)
2. Edit control mapping (sync status = ⚠️ modified)
3. Send mode (sync status = ✅ synced)

**Test 4: Slot Names Display**
1. Device connected
2. Click Refresh Slots
3. Verify 15 slot names appear
4. Verify slot 0 shows "FACTORY" (or actual name)

## UI/UX Considerations

### Visual Design

**Desktop Layout** (≥1280px):
```
┌─────────────────────────────────────────────────┐
│ [Slot 0] [Slot 1] ... [Slot 14]  [Refresh]     │
│  FACTORY  CHANNEVE   ...  MY MODE               │
│    ✅                                            │
└─────────────────────────────────────────────────┘
```

**Mobile Layout** (<768px):
```
┌──────────────────────┐
│ [0] [1] [2] ... [14] │  ← Horizontal scroll
│ FAC CH  MY      ---  │
│ ✅                    │
└──────────────────────┘
```

### Accessibility

- Keyboard navigation: Arrow keys to navigate slots, Enter to select
- ARIA labels: "Slot 0: FACTORY, Active, Synced"
- Focus indicators for keyboard users
- Color not sole indicator (icons + text)

### Error Handling

- **Device disconnects during fetch**: Show error toast, set status to 'unknown'
- **Slot read fails**: Use fallback name "Slot X" or "---"
- **Invalid slot index**: Clamp to 0-14 range
- **localStorage unavailable**: Use in-memory state only

### Performance

- **Slot name refresh**: 15 sequential reads ~1-2 seconds
  - Show loading spinner
  - Use cached names until refresh completes
- **Sync check**: Single device read when switching slots
  - Use optimistic status for edits
- **LocalStorage writes**: Debounced (already handled by React state)

## Known Limitations & Future Enhancements

### Current Limitations

1. **Sequential slot loading**: Fetching 15 slots takes time (not parallel in library API)
2. **No slot renaming**: Must rename on device, then refresh
3. **No slot copying**: Can't duplicate modes between slots via UI
4. **No bulk operations**: Can't fetch all slots at once

### Future Enhancements

1. **Slot Metadata Display**:
   - Show last modified date
   - Show mode type/category
   - Show number of customized controls

2. **Slot Operations**:
   - Copy mode from one slot to another
   - Rename slot (if library supports)
   - Clear slot (reset to factory)

3. **Sync Options**:
   - Auto-sync on change (background save)
   - Conflict resolution UI
   - Sync indicator in header/status bar

4. **Performance**:
   - Parallel slot fetching (if library adds support)
   - Incremental slot loading (load visible slots first)
   - WebSocket-style device updates

## Verification Criteria

### Manual Testing Checklist

- [ ] 15 slots displayed with names from device
- [ ] Active slot visually distinct
- [ ] Click slot to select it
- [ ] Active slot persists across page reload
- [ ] Fetch button uses active slot
- [ ] Send button uses active slot
- [ ] Sync indicator shows ✅ after fetch
- [ ] Sync indicator shows ⚠️ after edit
- [ ] Sync indicator shows ✅ after send
- [ ] Sync indicator shows ❓ when device disconnected
- [ ] Refresh button fetches latest slot names
- [ ] Refresh disabled when device disconnected
- [ ] Horizontal scroll works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader announces slot changes

### Automated Test Coverage

- [ ] Unit tests for persistence utilities
- [ ] Unit tests for sync detection
- [ ] Integration tests for SlotCard component
- [ ] Integration tests for SlotSelector component
- [ ] E2E test for slot selection persistence
- [ ] E2E test for fetch/send using active slot
- [ ] E2E test for sync status updates

## Dependencies

### New Dependencies
None - uses existing UI components and device API

### Modified Files
- `src/pages/Editor.tsx` - Add slot state and UI
- `src/hooks/useLCXL3Device.ts` - Add `fetchAllSlotNames`
- `src/contexts/LCXL3Context.tsx` - Update interface

### New Files
- `src/utils/slotPersistence.ts` - LocalStorage for slots
- `src/utils/syncDetection.ts` - Sync status logic
- `src/components/editor/SlotCard.tsx` - Individual slot UI
- `src/components/editor/SlotSelector.tsx` - Slot container UI

## Timeline Estimate

- **Task 1-3**: 2 hours (utilities)
- **Task 4-5**: 3 hours (components)
- **Task 6-8**: 4 hours (integration)
- **Task 9**: 2 hours (optimization)
- **Testing**: 3 hours (unit + E2E)
- **Documentation**: 1 hour

**Total**: ~15 hours

## Notes

- Slot indices are 0-14 (15 slots total) per LCXL3 hardware spec
- Slot names are 8 characters max (hardware limitation)
- Active slot state is separate from edit buffer (can switch slots without losing edits)
- Sync status is per-slot (only active slot has status)
- Device connection not required to view cached slot names

---

**Status**: 🔵 Ready for Implementation
