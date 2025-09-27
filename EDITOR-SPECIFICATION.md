# Launch Control XL3 Editor - Feature Specification

**Version**: 1.0.0
**Date**: 2025-09-26
**Purpose**: Comprehensive specification for feature testing

---

## Table of Contents
1. [Overview](#overview)
2. [User Interface Components](#user-interface-components)
3. [Core Features](#core-features)
4. [User Workflows](#user-workflows)
5. [State Management](#state-management)
6. [Storage & Persistence](#storage--persistence)
7. [MIDI Integration](#midi-integration)
8. [Expected Behaviors](#expected-behaviors)
9. [Error Handling](#error-handling)
10. [Performance Requirements](#performance-requirements)

---

## Overview

### Purpose
The Launch Control XL3 Editor is a web-based application for creating, editing, and managing custom MIDI control mappings for the Novation Launch Control XL3 hardware controller.

### Target Users
- Music producers and audio engineers
- Live performers using MIDI controllers
- DAW users requiring custom MIDI mappings

### Browser Requirements
- **Primary**: Chrome/Chromium (WebMIDI support)
- **Secondary**: Edge (WebMIDI support)
- **Limited**: Firefox, Safari (UI only, no MIDI)

---

## User Interface Components

### 1. Header Navigation
**Location**: Top of page
**Components**:
- **Logo/Branding**: "XL 3" with link to home
- **Navigation Tabs**: Editor (active), Library, Catalog
- **Connection Status**: Shows "Disconnected" or device name
- **Settings Button**: Access to application settings

**Expected Behaviors**:
- Navigation tabs highlight active page
- Connection status updates in real-time
- Logo always links to home/editor page

---

### 2. Editor Header Section
**Location**: Below navigation, above controller visual
**Components**:

#### Mode Title
- **Element**: H1 heading "Mode Editor"
- **Subheading**: "Design custom control mappings for your Launch Control XL3"

#### Action Buttons (Right side)
1. **Reset Button**
   - Icon: Rotate/Refresh icon
   - Color: Outline/Secondary
   - State: Enabled when mode has data

2. **Import Button**
   - Icon: Upload arrow
   - Color: Outline
   - Function: Opens file picker for JSON import

3. **Export Button**
   - Icon: Download arrow
   - Color: Outline
   - Function: Downloads current mode as JSON

4. **Send Button**
   - Icon: Play/Send icon
   - Color: Green/Secondary with glow
   - State: Disabled when no device connected

5. **Save Button**
   - Icon: Save/Floppy disk
   - Color: Primary blue with glow
   - State: Always enabled

**Expected Behaviors**:
- All buttons show hover states
- Disabled buttons have reduced opacity and no pointer
- Icons render correctly from lucide-react
- Buttons maintain consistent sizing and spacing

---

### 3. Controller Visual
**Location**: Main content area, center
**Purpose**: Interactive visualization of Launch Control XL3 hardware

#### Layout
- **Container**: Card with gradient background and border
- **SVG Canvas**: 920x680px viewBox
- **Responsive**: Scales to fit container

#### Hardware Controls (Total: 48 controls)

##### Top Row Knobs (8 knobs)
- **CC Numbers**: 13-20
- **LED Color**: Red
- **Position**: Top row, evenly spaced
- **Visual**: Circular knobs with indicator line

##### Middle Row Knobs (8 knobs)
- **CC Numbers**: 53, 22-28
- **LED Color**: Orange
- **Position**: Middle row
- **Note**: CC 53 is first, then 22-28

##### Bottom Row Knobs (8 knobs)
- **CC Numbers**: 29-36
- **LED Color**: Yellow
- **Position**: Bottom row

##### Vertical Faders (8 faders)
- **CC Numbers**: 5-12
- **Position**: Below knobs
- **Visual**: Vertical sliders with track and handle

##### Top Button Row (8 buttons)
- **CC Numbers**: 37-44
- **LED Color**: Green
- **Position**: Below faders
- **Visual**: Rounded rectangle buttons with LED strip

##### Bottom Button Row (8 buttons)
- **CC Numbers**: 45-52
- **LED Color**: Blue
- **Position**: Bottom row
- **Visual**: Same as top buttons

**Expected Behaviors**:
- **Hover State**: Controls scale slightly (1.1x) on hover
- **Selection**: Clicked control shows blue border and shadow
- **Animation**: Controls animate in sequentially on load
- **Labels**: CC numbers display below each control
- **LED Indicators**: Show above/below controls with appropriate colors
- **Selection Info**: Selected control info appears in top-right corner

---

### 4. Properties Panel (Sidebar)
**Location**: Right side, fixed width
**Width**: ~400px

#### Mode Settings Section
**Components**:
- **Mode Name Input**
  - Label: "Mode Name"
  - Default: "New Custom Mode"
  - Type: Text input
  - Max length: 100 characters

- **Description Textarea**
  - Label: "Description"
  - Placeholder: "Describe your custom mode..."
  - Rows: 3
  - Max length: 500 characters

**Expected Behaviors**:
- Changes trigger isDirty flag
- Auto-save after 2 seconds of inactivity
- Validation prevents empty mode names

#### Control Properties Section
**Display States**:

##### No Control Selected
- Icon: Settings/Gear icon
- Message: "Select a control on the device to configure its properties"
- State: Disabled/placeholder appearance

##### Control Selected
Shows editable fields:

1. **Control Label**
   - Input type: Text
   - Shows current control name
   - Editable, updates mapping

2. **CC Number**
   - Input type: Number
   - Range: 0-127
   - Shows current MIDI CC assignment
   - Validation: Must be valid MIDI CC

3. **MIDI Channel**
   - Input type: Number
   - Range: 1-16
   - Default: 1
   - Validation: Must be 1-16

4. **Min Value**
   - Input type: Number
   - Range: 0-127
   - Default: 0
   - Validation: Must be ≤ Max Value

5. **Max Value**
   - Input type: Number
   - Range: 0-127
   - Default: 127
   - Validation: Must be ≥ Min Value

6. **Control Type** (Read-only)
   - Display: Badge showing "Knob", "Fader", or "Button"
   - Source: From control object

7. **Position Info** (Read-only)
   - Shows X, Y coordinates
   - Helps identify control location

**Expected Behaviors**:
- All changes update mode state immediately
- Invalid inputs show error styling
- Number inputs enforce min/max ranges
- Changes trigger auto-save timer
- Property panel scrolls if content overflows

---

### 5. MIDI Connection Component
**Location**: Sidebar top, above properties
**Status**: ⚠️ CURRENTLY NOT RENDERING (implementation issue)

**Design Spec**:
- **Card Layout**: Border, padding, rounded corners
- **Title**: "MIDI Connection" with USB icon
- **Status Badges**:
  - WebMIDI Support: Green "Ready" | Red "Not Supported"
  - Connection: Green "Connected" | Gray "Not Connected"

**Content When Connected**:
- Device name display
- Manufacturer info
- Connection status badge
- Disconnect button

**Content When Disconnected**:
- Device count display
- List of available devices
- Connect button for each device
- Refresh button

**Expected Behaviors**:
- Real-time WebMIDI status detection
- Auto-detect Launch Control XL3
- Show connection errors clearly
- Update when devices connect/disconnect
- Disabled state when WebMIDI not supported

---

### 6. Storage Status Component
**Location**: Bottom footer bar
**Status**: ⚠️ CURRENTLY NOT RENDERING (implementation issue)

**Design Spec**:
- **Layout**: Horizontal bar, full width
- **Background**: Muted gray
- **Border**: Top border only

**Content Areas**:

#### Left Section - Status Info
1. **Last Saved Timestamp**
   - Format: "Saved 5 seconds ago" or "just now"
   - Updates every 10 seconds
   - Shows "Never" if no save yet

2. **Storage Size**
   - Format: "1.2 KB" or "45 B"
   - Shows localStorage usage
   - Updates after each save

3. **Status Indicator**
   - Green dot: All changes saved
   - Yellow dot + pulse: Unsaved changes
   - Badge: "Saving..." during save operation

#### Right Section - Actions
1. **Manual Save Button**
   - Text: "Save Now"
   - State: Disabled when no changes
   - Shows spinner during save

2. **Clear Storage Button**
   - Text: "Clear"
   - Requires confirmation click
   - Shows "Confirm?" after first click
   - Auto-cancels after 3 seconds

**Expected Behaviors**:
- Timestamp updates in real-time
- Status indicator reflects isDirty state
- Manual save immediately persists data
- Clear storage resets to default mode
- Error messages display inline

---

## Core Features

### 1. Mode Management

#### Create New Mode
- Default name: "New Custom Mode"
- Empty description
- No control mappings initially
- Clean (not dirty) state

#### Edit Mode Properties
- Name and description editable
- Changes set isDirty = true
- Triggers auto-save after 2 seconds
- No maximum modes limit

#### Reset Mode
- Button shows confirmation dialog
- Clears all control mappings
- Resets to default name/description
- Clears selection
- Sets isDirty = false

---

### 2. Control Mapping

#### Select Control
**Trigger**: Click on any control in ControllerVisual
**Result**:
- Control highlighted with blue border
- Control info appears in top-right of visual
- Properties panel shows control details
- Previous selection cleared

#### Edit Control Properties
**Available Fields**:
- Control label (custom name)
- CC number (MIDI CC assignment)
- MIDI channel (1-16)
- Min/Max values (0-127)

**Validation Rules**:
- CC: 0-127 (standard MIDI range)
- Channel: 1-16 (MIDI channel range)
- Min ≤ Max (logical constraint)
- All values must be integers

**Effect**:
- Updates mode.controls object
- Sets isDirty = true
- Triggers auto-save timer
- Visual updates to reflect changes

---

### 3. Import/Export

#### Export Mode
**Trigger**: Click Export button
**Process**:
1. Serialize current mode to JSON
2. Format with 2-space indentation
3. Create Blob with type "application/json"
4. Generate download URL
5. Trigger browser download
6. Filename: `{mode-name}.json` (spaces → hyphens)
7. Clean up URL

**JSON Structure**:
```json
{
  "name": "My Custom Mode",
  "description": "Mode description here",
  "controls": {
    "SEND_A1": {
      "type": "knob",
      "channel": 1,
      "cc": 13,
      "min": 0,
      "max": 127,
      "behaviour": "absolute"
    }
  }
}
```

#### Import Mode
**Trigger**: Click Import button
**Process**:
1. Show file picker dialog
2. Filter: "application/json,.json"
3. Read file as text
4. Parse JSON with validation
5. Check for required fields (name, controls)
6. Load mode into state if valid
7. Show error if invalid
8. Set isDirty = true

**Validation**:
- Must be valid JSON
- Must have "name" property (string)
- Must have "controls" property (object)
- Optional: description, version, metadata

**Error Handling**:
- Invalid JSON: Alert "Invalid mode file. Please check the format."
- Missing required fields: Alert with specific error
- Cancel import: No change to current mode

---

### 4. Auto-Save System

#### Configuration
- **Debounce Delay**: 2000ms (2 seconds)
- **Storage Key**: "xl3-mode"
- **Storage Type**: localStorage

#### Trigger Conditions
- Mode name changed
- Mode description changed
- Control property modified
- Control mapping added/removed

#### Process Flow
1. User makes change
2. isDirty flag set to true
3. Existing timer cleared (if any)
4. New 2-second timer started
5. Timer expires → save to localStorage
6. Success: isDirty set to false
7. Failure: Error logged, isDirty remains true

#### Storage Format
- Key: "xl3-mode"
- Value: JSON stringified mode object
- Metadata: Timestamp, size tracked separately

**Expected Behaviors**:
- Multiple rapid changes = single save (debounced)
- Page refresh loads saved mode
- localStorage errors handled gracefully
- No save if mode unchanged
- Save completes before page unload

---

### 5. Send to Device

#### Trigger
- Click "Send" button
- Button only enabled when device connected

#### Current Implementation
- **Status**: Placeholder/Stub
- **Action**: Logs mode to console
- **Alert**: "Send to Device - Not yet implemented (requires SysEx protocol)"
- **Requires**: XL3 SysEx protocol documentation

#### Future Implementation (Not in MVP)
- Convert mode to MIDI SysEx messages
- Send configuration to Launch Control XL3
- Verify device accepted configuration
- Show progress/success feedback
- Handle device communication errors

---

## User Workflows

### Workflow 1: Create New Custom Mode

1. **User opens Editor** → Default mode loads
2. **User clicks Mode Name** → Input focused
3. **User types new name** → Name updates, isDirty = true
4. **User waits 2 seconds** → Auto-save triggers
5. **User clicks knob CC 13** → Control selected, properties shown
6. **User edits CC number to 50** → Mapping updated, isDirty = true
7. **User waits 2 seconds** → Auto-save triggers
8. **User clicks Export** → JSON downloads as "new-mode-name.json"

**Expected Result**: Mode saved, exported successfully

---

### Workflow 2: Load Existing Mode

1. **User opens Editor** → Check localStorage
2. **If saved mode exists** → Load from storage
3. **If no saved mode** → Load default empty mode
4. **User clicks Import** → File picker opens
5. **User selects JSON file** → File read and parsed
6. **If valid** → Mode loaded, UI updates
7. **If invalid** → Error alert shown

**Expected Result**: Valid modes load, invalid modes rejected with error

---

### Workflow 3: Edit Multiple Controls

1. **User selects control** → Properties panel updates
2. **User edits properties** → Changes saved to state
3. **User selects different control** → Panel switches to new control
4. **Previous control retains changes** → State persists
5. **User makes more edits** → All changes tracked
6. **After 2 seconds idle** → All changes auto-saved

**Expected Result**: All control edits persist and save

---

### Workflow 4: Connect MIDI Device

1. **Browser loads** → Check WebMIDI API availability
2. **If supported** → Request MIDI access
3. **User grants permission** → Scan for devices
4. **XL3 detected** → Update connection status
5. **Send button enables** → Ready for device communication
6. **User disconnects device** → Connection status updates
7. **Send button disables** → Prevents invalid operations

**Expected Result**: Real-time device connection tracking

---

### Workflow 5: Reset Mode

1. **User has edited mode** → isDirty = true, changes exist
2. **User clicks Reset** → Confirmation dialog appears
3. **User clicks Cancel** → Dialog closes, no change
4. **User clicks Reset again** → Confirmation appears
5. **User clicks OK** → Mode resets to defaults
6. **Control selection cleared** → Properties panel resets
7. **isDirty = false** → Clean state

**Expected Result**: Mode fully reset with confirmation safety

---

## State Management

### Mode State Object

```typescript
interface CustomMode {
  name: string;              // Mode name
  description: string;       // Mode description
  controls: {                // Control mappings
    [key: string]: ControlMapping;
  };
}

interface ControlMapping {
  type: 'knob' | 'fader' | 'button';
  channel: number;           // MIDI channel (1-16)
  cc: number;                // CC number (0-127)
  min: number;               // Min value (0-127)
  max: number;               // Max value (0-127)
  behaviour: 'absolute' | 'relative';
  label?: string;            // Custom label
}
```

### Control State
- **selectedControl**: Control | null
- Tracks currently selected control
- Updated on click
- Cleared on reset or deselect

### Dirty State
- **isDirty**: boolean
- True when changes exist
- False after save or reset
- Triggers auto-save
- Affects button states

### MIDI State
```typescript
interface MIDIState {
  isSupported: boolean;      // Browser has WebMIDI
  isInitialized: boolean;    // MIDI system ready
  devices: MIDIDevice[];     // Available devices
  xl3Device: MIDIDevice | null;  // Connected XL3
  error: string | null;      // Connection error
}
```

### Storage State
- **lastSaved**: number | null (timestamp)
- **storageSize**: number (bytes)
- **isLoading**: boolean
- **error**: string | null

---

## Storage & Persistence

### localStorage Schema

**Key**: `xl3-mode`

**Value Structure**:
```json
{
  "name": "string",
  "description": "string",
  "controls": {
    "controlId": {
      "type": "knob | fader | button",
      "channel": 1-16,
      "cc": 0-127,
      "min": 0-127,
      "max": 0-127,
      "behaviour": "absolute | relative"
    }
  }
}
```

### Storage Operations

#### Save
- **Trigger**: Auto-save timer, manual save button
- **Process**: JSON.stringify → localStorage.setItem
- **Error**: Catch quota exceeded, permission denied
- **Callback**: onSaveSuccess, onSaveError

#### Load
- **Trigger**: Page load, storage component mount
- **Process**: localStorage.getItem → JSON.parse
- **Validation**: Check for required fields
- **Callback**: onLoadSuccess, onLoadError

#### Clear
- **Trigger**: Clear storage button (with confirmation)
- **Process**: localStorage.removeItem
- **Result**: Reset to default mode

### Storage Limits
- **Browser Limit**: ~5-10MB (varies by browser)
- **Typical Mode Size**: 1-10 KB
- **Max Modes**: Hundreds (in practice)

---

## MIDI Integration

### WebMIDI API Detection

```typescript
const isSupported = 'requestMIDIAccess' in navigator;
```

**Browser Support**:
- ✅ Chrome/Chromium
- ✅ Edge (Chromium)
- ❌ Firefox (no WebMIDI)
- ❌ Safari (no WebMIDI)

### Device Detection

**Launch Control XL3 Identification**:
- Name contains: "Launch Control XL"
- Type: MIDI Output device
- State: "connected"

**Device Object**:
```typescript
interface MIDIDevice {
  id: string;
  name: string;
  manufacturer?: string;
  state: 'connected' | 'disconnected';
}
```

### Device Communication (Future)

**SysEx Message Structure** (Not yet implemented):
- Start: 0xF0 (SysEx start)
- Manufacturer ID: Novation ID
- Device ID: XL3 specific
- Command: Set mode configuration
- Data: Mode parameters
- End: 0xF7 (SysEx end)

---

## Expected Behaviors

### Visual Feedback

#### Hover States
- **Controls**: Scale 1.1x, cursor pointer
- **Buttons**: Brightness increase, cursor pointer
- **Inputs**: Border color change

#### Selection States
- **Control Selected**: Blue border, drop shadow, scale 1.1x
- **Control Info**: Overlay shows label, CC, channel, type

#### Loading States
- **Auto-save**: Status changes to "Saving..."
- **Manual save**: Button shows spinner
- **Import**: File dialog opens

#### Error States
- **Invalid Input**: Red border, error text
- **MIDI Error**: Red alert with error message
- **Storage Error**: Badge shows "Storage error"

### Animations

#### Page Load
- Controls animate in sequentially
- Delay: index * 0.03 seconds
- Effect: Fade in + slide up

#### Control Interactions
- Hover: Scale up 1.1x (200ms)
- Click: Scale down 0.95x then back (200ms)
- Selection: Smooth color transition (200ms)

#### State Changes
- Auto-save indicator: Fade in/out (300ms)
- Status badges: Smooth color transitions
- Error messages: Slide in from top

---

## Error Handling

### Input Validation Errors

#### Invalid CC Number
- **Condition**: Value < 0 or > 127
- **Response**: Clamp to 0-127, show warning
- **UI**: Red border, helper text

#### Invalid Channel
- **Condition**: Value < 1 or > 16
- **Response**: Clamp to 1-16, show warning
- **UI**: Red border, helper text

#### Invalid Min/Max
- **Condition**: min > max
- **Response**: Swap values, show warning
- **UI**: Orange border, helper text

### File Operation Errors

#### Import Invalid JSON
- **Error**: JSON.parse fails
- **Response**: Alert "Invalid mode file. Please check the format."
- **Recovery**: Mode unchanged

#### Import Missing Fields
- **Error**: Required field missing
- **Response**: Alert "Mode file missing required fields"
- **Recovery**: Mode unchanged

#### Export Failure
- **Error**: Browser blocks download
- **Response**: Console error, user notification
- **Recovery**: Retry option

### Storage Errors

#### Quota Exceeded
- **Error**: localStorage.setItem throws QuotaExceededError
- **Response**: Show error badge, suggest export
- **Recovery**: Clear old data or export mode

#### Permission Denied
- **Error**: localStorage access denied
- **Response**: Show warning, disable auto-save
- **Recovery**: Use session storage or in-memory only

### MIDI Errors

#### WebMIDI Not Supported
- **Error**: navigator.requestMIDIAccess not available
- **Response**: Show "Not Supported" badge
- **Recovery**: UI-only mode, no device communication

#### Device Connection Lost
- **Error**: Device disconnects during use
- **Response**: Update status, disable Send button
- **Recovery**: Auto-reconnect when device returns

#### Device Communication Error
- **Error**: sendMessage fails
- **Response**: Console error, user notification
- **Recovery**: Retry option, check connection

---

## Performance Requirements

### Page Load
- **Initial Paint**: < 1 second
- **Interactive**: < 2 seconds
- **Full Load**: < 3 seconds

### Interactions
- **Control Selection**: < 50ms
- **Property Update**: < 100ms
- **Visual Feedback**: Immediate (60fps)

### Storage Operations
- **Save to localStorage**: < 100ms
- **Load from localStorage**: < 50ms
- **JSON stringify/parse**: < 10ms

### Auto-Save
- **Debounce Delay**: 2000ms
- **Save Operation**: < 100ms
- **No UI Blocking**: Always responsive

### Animations
- **Frame Rate**: 60fps (16.67ms per frame)
- **Animation Duration**: 200-500ms typical
- **No Jank**: Smooth transitions always

### Memory Usage
- **Initial Load**: < 50MB
- **Runtime Stable**: < 100MB
- **No Memory Leaks**: Stable over time

---

## Testing Checklist

### Unit Tests
- [ ] useModeBuilder hook functions
- [ ] useMIDIDevice hook functions
- [ ] useLocalStorage hook functions
- [ ] Control mapping validation
- [ ] JSON import/export parsing

### Integration Tests
- [ ] Control selection updates properties
- [ ] Property changes trigger save
- [ ] Auto-save debouncing works
- [ ] Import loads valid modes
- [ ] Export downloads correct JSON
- [ ] Reset clears state properly

### UI Tests
- [ ] All controls render correctly
- [ ] Hover states work
- [ ] Selection highlights properly
- [ ] Properties panel shows correct values
- [ ] Buttons enable/disable correctly

### Browser Tests
- [ ] Chrome/Edge (with WebMIDI)
- [ ] Firefox (UI only)
- [ ] Safari (UI only)
- [ ] Mobile responsive (bonus)

### Edge Cases
- [ ] Empty mode name
- [ ] Maximum CC values (127)
- [ ] Minimum CC values (0)
- [ ] localStorage full
- [ ] Invalid JSON import
- [ ] Device disconnect during operation
- [ ] Multiple rapid changes (debounce test)
- [ ] Page refresh loads saved mode

---

## Known Issues & Limitations

### Current Implementation Issues

1. **MIDIConnection Component Not Rendering**
   - Status: Component created but not visible in UI
   - Impact: Device status not shown to user
   - Workaround: Top nav shows basic connection status

2. **StorageStatus Component Not Rendering**
   - Status: Component created but not visible in UI
   - Impact: Save status not shown to user
   - Workaround: None currently

3. **Editor.tsx Route Mismatch**
   - Status: Different Editor.tsx than integrated version
   - Impact: Integrated hooks not in running app
   - Resolution: Need to verify correct file is loaded

### MVP Limitations

1. **No SysEx Implementation**
   - Send to Device is placeholder only
   - Requires XL3 protocol documentation

2. **No Undo/Redo**
   - Changes are immediate and irreversible
   - Manual Export before changes recommended

3. **Single Mode Only**
   - No mode library or switching
   - One mode in editor at a time

4. **No Multi-Control Selection**
   - One control selected at a time
   - No bulk operations

5. **No Templates**
   - No pre-built mode templates
   - Start from scratch each time

---

## Future Enhancements

### Planned Features
- [ ] Mode library and management
- [ ] Undo/Redo functionality
- [ ] Multi-control selection
- [ ] Bulk edit operations
- [ ] Mode templates and presets
- [ ] SysEx implementation for Send to Device
- [ ] Bidirectional device sync
- [ ] Advanced MIDI routing
- [ ] Control groups and layers
- [ ] Color-coded control sections

### Nice-to-Have
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [ ] Control search/filter
- [ ] Mode version history
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Mobile app companion

---

## Appendix

### Control ID Mapping

The system uses semantic control IDs that map to CC numbers:

```typescript
// Top Row Knobs
"SEND_A1" → CC 13
"SEND_A2" → CC 14
// ... through SEND_A8 → CC 20

// Middle Row Knobs
"SEND_B1" → CC 53
"SEND_B2" → CC 22
// ... through SEND_B8 → CC 28

// Bottom Row Knobs
"PAN1" → CC 29
// ... through "PAN8" → CC 36

// Faders
"FADER1" → CC 5
// ... through "FADER8" → CC 12

// Buttons (top/bottom rows)
// CC 37-44 (top row)
// CC 45-52 (bottom row)
```

### Type Definitions

See `src/types/controls.ts` and `src/types/mode.ts` for complete TypeScript definitions.

### API Documentation

Currently no external API. All operations client-side with localStorage.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-09-26
**Status**: Ready for Test Development
**Next Review**: After initial test suite implementation