# Launch Control XL3 Editor - Feature Specification

**Version**: 1.0.0
**Date**: 2025-09-26
**Purpose**: Specification for feature testing

## Feature 1: Device MIDI Auto-Connect

Device info:
- MIDI Input  (Main): "LCXL3 _n_ MIDI In" (_n_: the nth LCXL3 device connected)
- MIDI Input  (DAW) : "LCXL3 _n_ DAW In"
- MIDI Output (Main : "LCXL3 _n_ MIDI Out"
- MIDI Output (DAW) : "LCXL3 _n_ DAW OUT"

1.1 When the web app loads or when a new device is connected, the web app auto-connects to the device.
- [x] App detects device, if connected
- [x] App initiates MIDI SysEx handshake (see [@oletizi/launch-control-xl3](https://www.npmjs.com/package/@oletizi/launch-control-xl3) npm package for protocol details)
- [x] On successful handshake, the connection status indicator in the top left of the main nav switches from "Disconnected" to "Connected" state.

**Status**: ✅ IMPLEMENTED (2025-09-26 - verified with hardware, see WORKPLAN-DEVICE-AUTOCONNECT.md)

## Feature 2: Custom Mode Local Storage
IMPORTANT: DEFERRED UNTIL AFTER MVP. DO NOT IMPLEMENT
2.1 Users can save the current mode to local file storage.
- [ ] When the user clicks on the Save button, the system offers to save it to the local filesystem

2.2 Users can load stored mode from the local filesystem into the active editor buffer
- [ ] When the user clicks on the Import button, the system offers to load a mode file from the local filesystem
- [ ] When the user selects a mode file, the system loads the mode data from the file into the active editor buffer.
- [ ] The UI elements are updated with the new mode data accordingly

**Status**: UNIMPLEMENTED, DEFERRED

## Feature 3: Control Properties
3.1 Users can set properties on the device controls
- [x] 3.1.1 The user can click on a control and the corresponding control properties editor loads
- [x] 3.1.2 The control CC number in the properties editor matches the control label in the visual display
- [x] 3.1.3 The property values in the properties editor are updated to match the model data structure in memory
- [x] 3.1.4 When the user changes control properties in the editor, the model data structure in memory is updated accordingly

**Status**: ✅ IMPLEMENTED (2025-09-26 - verified with Playwright MCP, see WORKPLAN-CONTROL-PROPERTIES.md) 

## Feature 4: State Persistence
4.1 Users can reload/return to the editor and it will remember their state
- [x] The model data structure is persistent such that changes made to it in the editor are available when the user returns to the editor
- [x] The model data structure is reset to default values when the reset button is pressed

**Status**: ✅ IMPLEMENTED (2025-09-26 - verified with Playwright MCP, see WORKPLAN-STATE-PERSISTENCE.md)

## Feature 5: Inline Edit Control Labels
5.1 Users can edit control label in the device visualization inline
- [x] The control label for a control in the device visualization agrees with the control label value in the model data structure and in the control properties editor
- [x] When a user double-clicks on the control label for a control in the device visualization, it turns into a text editor
- [x] When the user presses return/enter, the control label value in the model data structure is updated with the value of the text editor, and the control label text editor display is swapped with the default label display

**Status**: ✅ IMPLEMENTED (2025-09-27 - verified with Playwright MCP, see WORKPLAN-INLINE-LABEL-EDIT.md) 