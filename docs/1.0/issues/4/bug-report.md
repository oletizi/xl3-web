# BUG-002: Slot Write/Read Operations Not Persisting Data

**Status**: Open
**Severity**: High
**Component**: Web App Editor + @oletizi/launch-control-xl3 library
**Version**: xl3-web v0.1.0, @oletizi/launch-control-xl3 v1.20.2
**Date Reported**: 2025-10-13
**Reporter**: User
**GitHub Issue**: [#4](https://github.com/oletizi/xl3-web/issues/4)

## Summary

When using the web editor to fetch a mode from one slot, send it to a different slot, then fetch from the destination slot, the destination slot returns old data instead of the data that was just written. This indicates the write operation is either not working, writing to the wrong location, or a read operation is reading from the wrong location.

## User Workflow (Reproduction)

```
User Action                    Expected Result           Actual Result
────────────────────────────────────────────────────────────────────────
1. Select Slot 1               Slot 1 active             ✅ Slot 1 active
2. Click "Fetch"               Load mode from slot 1     ✅ Mode loaded
3. Select Slot 3               Slot 3 active             ✅ Slot 3 active
4. Click "Send"                Write mode to slot 3      ❓ Unknown
5. Click "Fetch"               Load mode from slot 3     ❌ Shows OLD slot 3 data
                               (should match slot 1)     (not the data just written)
```

## Expected Behavior

After step 4 (Send to Slot 3):
- Slot 3 on the device should contain the mode data from slot 1
- All 48 controls should have the same values as slot 1
- Control labels should match slot 1
- Mode name should match slot 1

After step 5 (Fetch from Slot 3):
- Editor should display the mode data that was just written
- All control values should match what was in slot 1
- Display should be identical to what was shown after step 2

## Actual Behavior

After step 5 (Fetch from Slot 3):
- Editor displays OLD data that was previously in slot 3
- Control values do not match slot 1
- Data appears unchanged from before the write operation
- The write operation had no observable effect

## Environment

- **Web App**: xl3-web v0.1.0
- **Library**: @oletizi/launch-control-xl3 v1.20.2
- **Device**: Novation Launch Control XL3
- **Browser**: Chrome/Safari (both affected)
- **OS**: macOS (Darwin 24.6.0)
- **Dev Server**: Vite v5.4.20

## Relationship to BUG-001

### BUG-001 Background

[BUG-001](./BUG-001-slot-write-always-slot-0.md) documented that the library's `buildCustomModeWriteRequest()` method hardcoded the slot byte to `0x00` instead of using the slot parameter. This caused all writes to go to slot 0 regardless of the intended target.

### BUG-001 Fix

According to [fix verification docs](./bug-001/fix-verification.md):
- ✅ Fix applied on 2025-10-09
- ✅ Method signature changed to `buildCustomModeWriteRequest(slot: number, page: number, modeData: CustomModeMessage)`
- ✅ Slot byte now uses `slot` parameter
- ✅ Automated tests passed for slots 0, 1, 3, 7, 14
- ✅ Version 1.20.2 published to npm

### The Mystery

**Despite the fix being verified and published, the issue persists in the web editor.**

This suggests:
1. The fix may not actually be in the published npm package
2. Browser/build cache is serving old code
3. There's a different bug in addition to the fixed BUG-001
4. The web app's state management is interfering

## Investigation Findings

### Library Source Code Verification

Checked local library source at `/Users/orion/work/ol_dsp/modules/audio-control/modules/launch-control-xl3/`:

```typescript
// src/core/SysExParser.ts (verified 2025-10-13)
static buildCustomModeWriteRequest(slot: number, page: number, modeData: CustomModeMessage): number[] {
  if (slot < 0 || slot > 14) {
    throw new Error('Custom mode slot must be 0-14');
  }
  // ...
  return [
    0xF0,             // SysEx start
    0x00, 0x20, 0x29, // Manufacturer ID (Novation)
    0x02,             // Device ID (Launch Control XL 3)
    0x15,             // Command (Custom mode)
    0x05,             // Sub-command
    0x00,             // Reserved
    0x45,             // Write operation
    page,             // Page number
    slot,             // ✅ Slot parameter is used correctly
    ...encodedData,
    0xF7              // SysEx end
  ];
}
```

**Finding**: Local source code HAS the fix.

### Installed Package Verification

Checked installed npm package:

```bash
$ cat node_modules/@oletizi/launch-control-xl3/package.json | grep version
"version": "1.20.2"

$ grep -A 3 "buildCustomModeWriteRequest" node_modules/.../dist/core/SysExParser.d.ts
static buildCustomModeWriteRequest(slot: number, page: number, modeData: CustomModeMessage): number[];
```

**Finding**: Type definition shows correct signature with slot parameter.

### Web App Code Verification

Checked `src/pages/Editor.tsx` handleSend function (lines 204-228):

```typescript
const handleSend = async () => {
  if (!device) {
    toast.error('Device not connected');
    return;
  }

  try {
    setSyncStatus('syncing');
    console.log('[handleSend] activeSlotIndex:', activeSlotIndex);
    console.log('[handleSend] typeof activeSlotIndex:', typeof activeSlotIndex);
    toast.info(`Sending mode to slot ${activeSlotIndex}...`);

    const lcxl3Mode = customModeToLCXL3Mode(mode);
    console.log('[handleSend] Calling device.saveCustomMode with slot:', activeSlotIndex);
    await device.saveCustomMode(activeSlotIndex, lcxl3Mode);  // ✅ Passes slot correctly

    setSyncStatus('synced');
    toast.success(`Mode sent successfully to slot ${activeSlotIndex}!`);
  } catch (error) {
    // ...
  }
};
```

**Finding**: Web app passes `activeSlotIndex` correctly to device.saveCustomMode().

## Possible Root Causes

### 1. Cache Issue (LIKELY)

**Hypothesis**: Vite/browser cache is serving old bundled library code despite npm package being updated.

**Evidence**:
- Dev server shows "Re-optimizing dependencies because lockfile has changed" (line in dev server output)
- This suggests Vite detected package change but may have only partially rebuilt

**Test**: Clear `.vite` cache and do hard refresh

### 2. Build Artifact Mismatch (POSSIBLE)

**Hypothesis**: Published npm package v1.20.2 doesn't actually contain the fix despite source code having it.

**Evidence**:
- Type definitions show correct signature
- But runtime JS may differ from types
- Library has two source directories (`src/` and `package/src/`) which historically caused drift

**Test**: Inspect actual bundled JS code, not just type definitions

### 3. State Management Race Condition (POSSIBLE)

**Hypothesis**: `activeSlotIndex` state may not be updated when send operation runs.

**Evidence**:
- `handleSlotSelect` updates `activeSlotIndex` state
- `handleSend` reads `activeSlotIndex` from state
- React state updates are asynchronous

**Test**: Add more diagnostic logging to verify slot value at exact moment of device call

### 4. DeviceManager Not Updated (LESS LIKELY)

**Hypothesis**: DeviceManager still calls old method signature.

**Evidence**:
- Type definitions show new signature
- Would cause TypeScript compilation error if calling with old signature
- App compiles successfully

**Test**: Check actual DeviceManager implementation in published package

### 5. Device Firmware Issue (UNLIKELY)

**Hypothesis**: Hardware doesn't actually support writing to slots other than 0.

**Evidence**:
- Reading from different slots works correctly
- Factory modes exist in multiple slots
- Novation documentation suggests multi-slot support

**Test**: Use manufacturer's software to verify device supports slot writes

## Diagnostic Steps

### Step 1: Verify Published Package Contents

```bash
# Check if compiled JS actually uses slot parameter
cd node_modules/@oletizi/launch-control-xl3/dist
grep -r "buildCustomModeWriteRequest" . | head -20

# Examine actual implementation, not just types
cat core/SysExParser.js | grep -A 50 "buildCustomModeWriteRequest"
```

### Step 2: Clear All Caches

```bash
# Stop dev server
pkill -f "vite"

# Clear Vite cache
rm -rf node_modules/.vite

# Clear browser cache or use incognito mode

# Restart dev server
pnpm dev
```

### Step 3: Add Diagnostic Logging

Add to `handleSend` before device call:

```typescript
// Log the actual device method being called
console.log('[DIAGNOSTIC] device.saveCustomMode:', device.saveCustomMode.toString());
console.log('[DIAGNOSTIC] activeSlotIndex at call time:', activeSlotIndex);
console.log('[DIAGNOSTIC] activeSlotIndex type:', typeof activeSlotIndex);
console.log('[DIAGNOSTIC] mode name being sent:', mode.name);
```

### Step 4: Test with Local Library Link

```bash
# In library directory
cd /Users/orion/work/ol_dsp/modules/audio-control/modules/launch-control-xl3
pnpm link

# In web app directory
cd /Users/orion/work/xl3-web
pnpm link @oletizi/launch-control-xl3

# This bypasses npm registry and uses local built version
```

### Step 5: Verify on Physical Device

After write operation:
1. Check device display - which slot number shows as active?
2. Use device buttons to navigate slots - which slot shows the new mode name?
3. Try loading slot on manufacturer's software - which slot has the new data?

## Impact Assessment

### Severity: High

- Core multi-slot functionality completely non-functional
- Users limited to single slot (1/15th of device capacity)
- Blocks use case of organizing different projects in different slots
- No workaround available

### Data Integrity: Unknown

- Write may be succeeding to wrong slot (data safe but in wrong location)
- Write may be failing entirely (data lost)
- Write may succeed but fetch reads from wrong location (data safe, read bug)

### User Trust: Degraded

- BUG-001 was marked as "FIXED AND VERIFIED" but issue persists
- Users may lose confidence in fix quality
- Need to rebuild trust through thorough investigation

## Next Steps

1. **Execute diagnostic steps** - Determine actual root cause
2. **Fix the root cause** - Whether cache, build, or code issue
3. **Verify fix with physical device** - Ground truth test
4. **Update documentation** - Record actual cause and solution
5. **Add regression test** - Prevent recurrence

## References

- **GitHub Issue**: https://github.com/oletizi/xl3-web/issues/4
- **BUG-001 Doc**: ./BUG-001-slot-write-always-slot-0.md
- **BUG-001 Fix**: ./bug-001/fix-verification.md
- **BUG-001 After Action**: ./bug-001/after-action.md
- **Editor Code**: src/pages/Editor.tsx:204-228
- **Library Source**: /Users/orion/work/ol_dsp/modules/audio-control/modules/launch-control-xl3/

---

**Last Updated**: 2025-10-13
**Status**: Investigation in progress
**Owner**: Development team
