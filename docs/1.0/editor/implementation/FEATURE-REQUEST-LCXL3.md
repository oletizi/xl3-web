# Feature Request: Web MIDI API Support for Browser Environments

**Package**: `@oletizi/launch-control-xl3` v1.0.12
**Requested By**: xl3-web project contributors
**Date**: 2025-09-27
**Priority**: High

## Summary

Request native Web MIDI API support to enable `LaunchControlXL3` class usage in browser environments for web-based MIDI editors and control applications.

## Problem Statement

Currently, `@oletizi/launch-control-xl3` relies on Node.js-specific dependencies (`EventEmitter` from 'events') that prevent it from running in browser environments:

```typescript
import { EventEmitter } from 'events';  // ❌ Not available in browsers

export class LaunchControlXL3 extends EventEmitter {
  // ...
}
```

**Error observed in browser**:
```
Module "events" has been externalized for browser compatibility.
Cannot access "events.EventEmitter" in client code.
TypeError: Class extends value undefined is not a constructor or null
```

This blocks web developers from using the excellent device control and custom mode management features in browser-based applications.

## Current Workaround Limitations

We attempted to use the library in our React/Vite web application but had to implement workarounds:

1. **Custom hook using existing Web MIDI connection**: We built `useLCXL3Device` that wraps our existing `MIDIConnectionManager`
2. **Placeholder SysEx implementation**: Cannot actually fetch modes from device
3. **Limited functionality**: Only connection state tracking, no actual device communication

## Proposed Solution

### Option 1: Web MIDI Backend (Recommended)

Add a Web MIDI backend implementation alongside existing Node.js backend:

```typescript
// src/core/backends/WebMidiBackend.ts
export class WebMidiBackend implements MidiBackendInterface {
  private midiAccess: MIDIAccess | null = null;

  async initialize(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API not available');
    }

    this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
  }

  async getInputPorts(): Promise<MidiPortInfo[]> {
    if (!this.midiAccess) throw new Error('Not initialized');

    return Array.from(this.midiAccess.inputs.values()).map(input => ({
      id: input.id,
      name: input.name || 'Unknown',
      manufacturer: input.manufacturer || 'Unknown'
    }));
  }

  async getOutputPorts(): Promise<MidiPortInfo[]> {
    if (!this.midiAccess) throw new Error('Not initialized');

    return Array.from(this.midiAccess.outputs.values()).map(output => ({
      id: output.id,
      name: output.name || 'Unknown',
      manufacturer: output.manufacturer || 'Unknown'
    }));
  }

  async openInput(portId: string): Promise<MidiInputPort> {
    const input = this.midiAccess?.inputs.get(portId);
    if (!input) throw new Error(`Input port ${portId} not found`);

    return {
      id: input.id,
      name: input.name || 'Unknown',
      type: 'input',
      onMessage: undefined,
      close: async () => { await input.close(); }
    };
  }

  async openOutput(portId: string): Promise<MidiOutputPort> {
    const output = this.midiAccess?.outputs.get(portId);
    if (!output) throw new Error(`Output port ${portId} not found`);

    return {
      id: output.id,
      name: output.name || 'Unknown',
      type: 'output',
      close: async () => { await output.close(); }
    };
  }

  async sendMessage(port: MidiOutputPort, message: MidiMessage): Promise<void> {
    const output = this.midiAccess?.outputs.get(port.id);
    if (!output) throw new Error(`Output port ${port.id} not found`);

    if (message.data) {
      output.send(Array.from(message.data));
    }
  }

  async closePort(port: MidiPort): Promise<void> {
    await port.close();
  }

  async cleanup(): Promise<void> {
    if (this.midiAccess) {
      for (const input of this.midiAccess.inputs.values()) {
        await input.close();
      }
      for (const output of this.midiAccess.outputs.values()) {
        await output.close();
      }
    }
  }
}
```

### Option 2: Use Browser-Compatible Event Emitter

Replace Node.js `EventEmitter` with a browser-compatible alternative like `eventemitter3`:

```typescript
import { EventEmitter } from 'eventemitter3';  // Works in both Node and browser

export class LaunchControlXL3 extends EventEmitter {
  // Existing code remains the same
}
```

Update `package.json`:
```json
{
  "dependencies": {
    "eventemitter3": "^5.0.1"
  }
}
```

### Option 3: Dual Build System

Provide separate builds for Node.js and browser environments:

```json
{
  "main": "./dist/index.js",           // Node.js build
  "browser": "./dist/browser.js",      // Browser build
  "exports": {
    ".": {
      "node": "./dist/index.js",
      "browser": "./dist/browser.js",
      "default": "./dist/index.js"
    }
  }
}
```

## Required API Surface

For our web-based LCXL3 editor, we need access to:

### 1. Device Initialization
```typescript
const device = new LaunchControlXL3({
  autoConnect: true,
  enableCustomModes: true,
  enableLedControl: false
});

await device.initialize();
```

### 2. Connection Events
```typescript
device.on('device:connected', (deviceInfo) => {
  console.log('Connected:', deviceInfo.name);
});

device.on('device:disconnected', () => {
  console.log('Disconnected');
});

device.on('device:error', (error) => {
  console.error('Device error:', error);
});
```

### 3. Custom Mode Operations
```typescript
// Fetch current mode from device (slot 0 = currently active mode)
const mode = await device.loadCustomMode(0);

// mode should return:
{
  name: string;
  controls: Record<string, {
    type: 'knob' | 'fader' | 'button';
    channel: number;
    cc: number;
    min: number;
    max: number;
    behaviour?: string;
  }>;
  leds?: Map<number, { color: number; behaviour: string }>;
  metadata?: {
    slot: number;
    createdAt: Date;
    modifiedAt: Date;
  };
}

// Write mode to device
await device.saveCustomMode(0, customMode);
```

### 4. SysEx Communication
The Web MIDI API fully supports SysEx messages. We need the existing SysEx protocol implementation to work with Web MIDI's message format:

```typescript
// Web MIDI provides:
input.onmidimessage = (event) => {
  // event.data is Uint8Array containing SysEx bytes
  const sysexData = Array.from(event.data);
};

output.send([0xF0, 0x00, 0x20, 0x29, ...moreBytes, 0xF7]);
```

## Use Case

**Project**: xl3-web - Web-based Launch Control XL3 Mode Editor
**Tech Stack**: React 18, TypeScript 5.8, Vite 5.4
**Goal**: Create a browser-based visual editor for LCXL3 custom modes with:
- Real-time device connection via Web MIDI
- Fetch current mode from device
- Visual control mapping editor
- Send edited mode back to device
- Save/load mode files locally

**Current Status**:
- ✅ UI complete with 48 control mappings
- ✅ Connection management working
- ✅ Mode state management working
- ❌ **Blocked**: Cannot use `@oletizi/launch-control-xl3` in browser
- ❌ **Workaround**: Custom SysEx implementation needed (duplicating your work)

## Benefits

1. **Broader Adoption**: Enable web developers to build LCXL3 tools
2. **No Duplication**: Avoid developers reimplementing SysEx protocol
3. **Consistency**: Single source of truth for LCXL3 protocol
4. **Modern Stack**: Support modern web frameworks (React, Vue, Svelte)
5. **Offline-First**: Web apps can work offline with local storage

## Target Platforms

- ✅ Chrome/Edge (Web MIDI fully supported)
- ✅ Opera (Web MIDI fully supported)
- ⚠️ Firefox (Web MIDI behind flag, but improving)
- ❌ Safari (no Web MIDI support currently)

## Compatibility Considerations

### Maintain Node.js Support
Existing Node.js users must continue working without changes:
```typescript
// Node.js users
import { LaunchControlXL3 } from '@oletizi/launch-control-xl3';
// Automatically uses NodeMidiBackend
```

### Auto-Detect Environment
```typescript
// Auto-detect and use appropriate backend
async autoDetectBackend(): Promise<MidiBackendInterface> {
  // Browser environment
  if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
    return new WebMidiBackend();
  }

  // Node.js environment
  try {
    const { NodeMidiBackend } = await import('./backends/NodeMidiBackend.js');
    return new NodeMidiBackend();
  } catch {
    throw new Error('No MIDI backend available');
  }
}
```

## Implementation Notes

### Browser Build Requirements
```json
{
  "devDependencies": {
    "vite": "^5.0.0"  // For browser builds
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "WebMIDI"]
  }
}
```

### Bundle Size Considerations
- Web MIDI backend adds ~2-3KB gzipped
- Consider optional peer dependencies for Node.js modules
- Tree-shaking should eliminate unused backends

## Testing Requirements

### Browser Testing
- Test in Chrome/Chromium with real LCXL3 hardware
- Mock Web MIDI API for unit tests
- E2E tests with Playwright

### Node.js Testing
- Ensure existing tests continue passing
- No breaking changes to current API

## Migration Path for Existing Users

**Zero breaking changes required**:
```typescript
// Existing code continues to work
const device = new LaunchControlXL3();
await device.initialize();  // Auto-detects backend
```

**Explicit backend selection (optional)**:
```typescript
import { LaunchControlXL3, WebMidiBackend } from '@oletizi/launch-control-xl3';

const device = new LaunchControlXL3({
  midiBackend: new WebMidiBackend()
});
```

## References

- [Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [Web MIDI Browser Support](https://caniuse.com/midi)
- [MDN: Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- Our project: [xl3-web](https://github.com/user/xl3-web) (if applicable)

## Alternatives Considered

1. **Fork the library**: Would create fragmentation and maintenance burden
2. **Polyfill Node.js modules**: Adds bloat (50KB+) and complexity
3. **Reimplement SysEx protocol**: Duplicates excellent work, error-prone
4. **Use different library**: No other library provides LCXL3 SysEx support

## Questions / Discussion

1. Would you prefer Option 1 (Web MIDI backend) or Option 2 (eventemitter3)?
2. Are you open to PRs for this feature?
3. Any concerns about maintaining dual platform support?
4. Would you like us to contribute test cases for Web MIDI?

## Contact

Feel free to reach out if you'd like to discuss this feature request or if we can help with implementation.

---

**Thank you for building an excellent LCXL3 library!** We'd love to use it in our web application rather than reimplementing the protocol.