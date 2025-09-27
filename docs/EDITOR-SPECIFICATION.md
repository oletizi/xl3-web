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

2.1 Users can save the current mode to local file storage.
- [x] When the user clicks on the Save button, the system offers to save it to the local filesystem

2.2 Users can load stored mode from the local filesystem into the active editor buffer
- [x] When the user clicks on the Import button, the system offers to load a mode file from the local filesystem
- [x] When the user selects a mode file, the system loads the mode data from the file into the active editor buffer.
- [x] The UI elements are updated with the new mode data accordingly

**Status**: ✅ IMPLEMENTED (2025-09-26 - verified with Playwright MCP, see WORKPLAN-CUSTOM-MODE-STORAGE.md)