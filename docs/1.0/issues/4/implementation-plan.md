# BUG-002 Implementation Plan: Slot Write/Read Data Persistence

**Date**: 2025-10-13
**Status**: Investigation Phase
**Owner**: Development Team
**Priority**: High

---

## Overview

This document outlines the investigation and fix plan for BUG-002, where slot write/read operations fail to persist data to the selected slot. The bug manifests when fetching from one slot, sending to another, then fetching the destination slot returns old data instead of the newly written data.

---

## Phase 1: Root Cause Investigation (2-4 hours)

### Goal
Determine the actual cause of the data persistence failure through systematic diagnostic testing.

### Tasks

#### Task 1.1: Verify Published NPM Package Contents

**Objective**: Confirm that npm package v1.20.2 actually contains the BUG-001 fix.

**Steps**:
```bash
# 1. Navigate to installed package
cd node_modules/@oletizi/launch-control-xl3/dist

# 2. List available JS files
find . -name "*.js" -type f

# 3. Find buildCustomModeWriteRequest in compiled code
grep -r "buildCustomModeWriteRequest" . | head -20

# 4. If found, examine the implementation
# Look for the slot byte in the return array - should be variable, not 0x00
```

**Success Criteria**:
- [ ] Located buildCustomModeWriteRequest in compiled JS
- [ ] Verified slot byte is NOT hardcoded to 0x00
- [ ] Confirmed method signature matches type definitions

**Failure Action**: If slot byte is hardcoded, library rebuild/republish needed.

#### Task 1.2: Clear All Caches

**Objective**: Eliminate caching as the root cause.

**Steps**:
```bash
# 1. Stop dev server
pkill -f "vite"

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Clear browser cache
# - Chrome: Cmd+Shift+Delete, clear cached images and files
# - OR use Incognito/Private mode

# 4. Rebuild node_modules (optional but thorough)
rm -rf node_modules/.pnpm
pnpm install

# 5. Restart dev server
pnpm dev
```

**Success Criteria**:
- [ ] All caches cleared
- [ ] Fresh dev server started
- [ ] Browser using fresh cache

**Test**: Retry the reproduction steps. If issue persists, caching is not the cause.

#### Task 1.3: Add Diagnostic Logging

**Objective**: Trace actual data flow from UI through to device call.

**Changes to `src/pages/Editor.tsx`**:

```typescript
// In handleSend, before device.saveCustomMode call:
const handleSend = async () => {
  if (!device) {
    toast.error('Device not connected');
    return;
  }

  try {
    setSyncStatus('syncing');

    // === DIAGNOSTIC LOGGING START ===
    console.group('=== SEND DIAGNOSTIC ===');
    console.log('1. activeSlotIndex:', activeSlotIndex);
    console.log('2. activeSlotIndex type:', typeof activeSlotIndex);
    console.log('3. mode.name:', mode.name);
    console.log('4. sample control value:', mode.controls['knob-0']?.ccNumber);

    // Log device method to verify it's the expected function
    console.log('5. device.saveCustomMode:', device.saveCustomMode.toString().substring(0, 200));

    const lcxl3Mode = customModeToLCXL3Mode(mode);
    console.log('6. converted mode name:', lcxl3Mode.name);
    console.log('7. converted controls count:', Object.keys(lcxl3Mode.controls).length);
    console.groupEnd();
    // === DIAGNOSTIC LOGGING END ===

    toast.info(`Sending mode to slot ${activeSlotIndex}...`);
    await device.saveCustomMode(activeSlotIndex, lcxl3Mode);
    setSyncStatus('synced');
    toast.success(`Mode sent successfully to slot ${activeSlotIndex}!`);
  } catch (error) {
    // ...
  }
};
```

**Also add logging to handleFetch**:

```typescript
// In handleFetch, after device.loadCustomMode call:
const handleFetch = async () => {
  if (!device) {
    toast.error('Device not connected');
    return;
  }

  try {
    setSyncStatus('syncing');

    console.group('=== FETCH DIAGNOSTIC ===');
    console.log('1. Fetching from slot:', activeSlotIndex);
    console.groupEnd();

    toast.info(`Fetching mode from slot ${activeSlotIndex}...`);
    const lcxl3Mode = await device.loadCustomMode(activeSlotIndex);

    console.group('=== FETCH RESULT ===');
    console.log('2. Received mode name:', lcxl3Mode.name);
    console.log('3. Received controls count:', Object.keys(lcxl3Mode.controls).length);
    console.log('4. Sample control:', Object.entries(lcxl3Mode.controls)[0]);
    console.groupEnd();

    const fetchedMode = lcxl3ModeToCustomMode(lcxl3Mode);
    // ... rest of function
  }
};
```

**Success Criteria**:
- [ ] Diagnostic logging added
- [ ] Browser console shows logs during send/fetch
- [ ] Logs reveal data flow and values

**Analysis**: Compare slot numbers, mode names, and control values across operations.

#### Task 1.4: Test with Local Library Link

**Objective**: Verify the fix works when using local library directly.

**Steps**:
```bash
# 1. In library directory, build and link
cd /Users/orion/work/ol_dsp/modules/audio-control/modules/launch-control-xl3
pnpm build
pnpm link

# 2. In web app directory, use linked version
cd /Users/orion/work/xl3-web
pnpm link @oletizi/launch-control-xl3

# 3. Verify link
ls -la node_modules/@oletizi/launch-control-xl3

# 4. Restart dev server
pkill -f "vite"
pnpm dev

# 5. Test reproduction steps
```

**Success Criteria**:
- [ ] Local library linked successfully
- [ ] Web app uses local version
- [ ] Slot write/read works correctly

**Analysis**:
- If works: npm package is broken, local source is correct → Republish needed
- If fails: Bug exists in local source too → Code fix needed

#### Task 1.5: Physical Device Verification

**Objective**: Determine ground truth of what's actually on the device.

**Steps**:
1. After write operation to slot 3:
   - Press slot buttons on physical device
   - Navigate to slot 3
   - Check mode name on device display
   - Compare to what was sent

2. Use Novation Components (manufacturer software):
   - Load device in Components
   - Check which slot has the new mode
   - Verify data integrity

**Success Criteria**:
- [ ] Physical device inspected
- [ ] Actual slot location determined
- [ ] Data integrity verified

**Possible Outcomes**:
- Data in slot 3: Write works, fetch bug
- Data in slot 0: BUG-001 not fixed
- Data in slot 1: Off-by-one error
- Data nowhere: Write failing entirely

---

## Phase 2: Fix Implementation (2-6 hours)

### Scenario A: Cache Issue

**If diagnostic reveals**: Fresh code loads after cache clear

**Fix**: None needed in code

**Actions**:
1. Document cache clearing as troubleshooting step
2. Add note to README about clearing cache after library updates
3. Consider adding cache-busting in dev server config

### Scenario B: NPM Package Broken

**If diagnostic reveals**: Local link works, npm package doesn't

**Fix**: Rebuild and republish library

**Actions**:
```bash
cd /Users/orion/work/ol_dsp/modules/audio-control/modules/launch-control-xl3

# 1. Clean build
rm -rf dist
pnpm build

# 2. Verify dist contains fix
grep -A 30 "buildCustomModeWriteRequest" dist/core/SysExParser.js

# 3. Bump version
npm version patch  # 1.20.2 → 1.20.3

# 4. Publish
npm publish

# 5. Update web app
cd /Users/orion/work/xl3-web
pnpm update @oletizi/launch-control-xl3
```

### Scenario C: DeviceManager Bug

**If diagnostic reveals**: Wrong parameters passed to SysEx builder

**Fix**: Update DeviceManager calls

**Location**: `launch-control-xl3/src/device/DeviceManager.ts`

**Changes**:
```typescript
// Around line 856
const page0Message = SysExParser.buildCustomModeWriteRequest(slot, 0, page0Data);

// Around line 867
const page3Message = SysExParser.buildCustomModeWriteRequest(slot, 3, page3Data);
```

**Verify**: Slot is first parameter, page is second parameter.

### Scenario D: State Management Issue

**If diagnostic reveals**: activeSlotIndex wrong at call time

**Fix**: Use useRef or callback to ensure fresh value

**Location**: `src/pages/Editor.tsx`

**Changes**:
```typescript
// Create ref for slot
const activeSlotRef = useRef(activeSlotIndex);

// Update ref whenever slot changes
useEffect(() => {
  activeSlotRef.current = activeSlotIndex;
}, [activeSlotIndex]);

// Use ref in handleSend
const handleSend = async () => {
  const targetSlot = activeSlotRef.current;  // Always fresh
  console.log('Sending to slot:', targetSlot);
  await device.saveCustomMode(targetSlot, lcxl3Mode);
};
```

### Scenario E: Read/Write Asymmetry

**If diagnostic reveals**: Write succeeds but fetch reads wrong slot

**Fix**: Verify slot parameter used in read operations

**Location**: Check both DeviceManager read and write paths

**Changes**: Ensure symmetry between read and write slot handling.

---

## Phase 3: Verification (1-2 hours)

### Automated Testing

**Create integration test**: `tests/e2e/slot-persistence.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Slot Persistence', () => {
  test('should persist data across slot write and read operations', async ({ page }) => {
    // 1. Navigate to editor
    await page.goto('http://localhost:8080/');

    // 2. Wait for device connection
    await page.waitForSelector('[data-testid="device-connected"]');

    // 3. Select slot 1
    await page.click('[data-testid="slot-selector-1"]');

    // 4. Fetch from slot 1
    await page.click('[data-testid="fetch-button"]');
    await page.waitForSelector('[data-testid="sync-status-synced"]');

    // 5. Get mode name
    const sourceModeName = await page.inputValue('[data-testid="mode-name-input"]');

    // 6. Select slot 3
    await page.click('[data-testid="slot-selector-3"]');

    // 7. Send to slot 3
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="sync-status-synced"]');

    // 8. Fetch from slot 3
    await page.click('[data-testid="fetch-button"]');
    await page.waitForSelector('[data-testid="sync-status-synced"]');

    // 9. Verify mode name matches
    const targetModeName = await page.inputValue('[data-testid="mode-name-input"]');
    expect(targetModeName).toBe(sourceModeName);
  });
});
```

**Run test**:
```bash
pnpm test:e2e
```

### Manual Testing

**Test matrix**:

| Source Slot | Target Slot | Expected Result | Status |
|-------------|-------------|-----------------|--------|
| 0 | 1 | Data copied | [ ] |
| 1 | 3 | Data copied | [ ] |
| 3 | 7 | Data copied | [ ] |
| 7 | 14 | Data copied | [ ] |
| 14 | 0 | Data copied | [ ] |

**For each test**:
1. Fetch from source slot
2. Note mode name and 3 control values
3. Send to target slot
4. Fetch from target slot
5. Verify mode name matches
6. Verify control values match
7. Check physical device display

### Physical Device Verification

**Steps**:
1. Complete manual test matrix above
2. For each target slot:
   - Use device buttons to navigate to that slot
   - Verify mode name on device display matches
   - Trigger a control (encoder/fader/button)
   - Verify MIDI message matches expected CC number

**Success Criteria**:
- All 5 test cases pass
- Physical device shows correct data in correct slots
- MIDI messages from device match expected values

---

## Phase 4: Documentation (1 hour)

### Update BUG-002 Documentation

**File**: `docs/1.0/issues/BUG-002-slot-write-read-not-persisting.md`

**Add sections**:
- Root Cause (determined in Phase 1)
- Fix Applied (implemented in Phase 2)
- Verification Results (from Phase 3)
- Resolution Date
- Lessons Learned

### Create Fix Verification Report

**File**: `docs/1.0/issues/bug-002/fix-verification.md`

**Contents** (modeled after bug-001/fix-verification.md):
- Changes made
- Verification method
- Test results
- Before/after comparison
- Impact analysis

### Update GitHub Issue

**Close issue #4** with comment:

```markdown
## Fixed in version X.X.X

**Root Cause**: [describe actual cause found]

**Fix**: [describe fix applied]

**Verification**:
- ✅ Automated tests pass
- ✅ Manual test matrix complete
- ✅ Physical device verified

**Documentation**:
- Bug report: docs/1.0/issues/BUG-002-slot-write-read-not-persisting.md
- Fix verification: docs/1.0/issues/bug-002/fix-verification.md
- Implementation plan: docs/1.0/issues/bug-002/implementation-plan.md

Closing as resolved.
```

---

## Risk Assessment

### High Risk Items

1. **NPM Package Corruption**
   - Risk: Published package may not match source
   - Mitigation: Verify build artifacts before publish
   - Contingency: Republish with verified build

2. **Firmware Compatibility**
   - Risk: Device firmware may not support multi-slot writes
   - Mitigation: Test with physical device early
   - Contingency: Document limitation if confirmed

3. **Cache Persistence**
   - Risk: Cache may persist across clear attempts
   - Mitigation: Test in incognito mode
   - Contingency: Hard reload (Cmd+Shift+R)

### Medium Risk Items

1. **State Management Race**
   - Risk: React state may be stale at call time
   - Mitigation: Use refs for critical values
   - Contingency: Add state snapshots to diagnostic logs

2. **Build Configuration**
   - Risk: Vite may not include updated library code
   - Mitigation: Verify bundled output
   - Contingency: Adjust vite.config.ts optimizeDeps

---

## Success Criteria

**Bug is considered fixed when**:
- [ ] All 5 manual test cases pass
- [ ] Automated E2E test passes
- [ ] Physical device verification confirms correct behavior
- [ ] Fix works on both Chrome and Safari
- [ ] Fix works with both npm package and local link
- [ ] No regression in other slot operations
- [ ] Documentation complete and accurate

---

## Timeline Estimate

| Phase | Estimated Time | Status |
|-------|----------------|--------|
| Phase 1: Investigation | 2-4 hours | Pending |
| Phase 2: Fix Implementation | 2-6 hours | Pending |
| Phase 3: Verification | 1-2 hours | Pending |
| Phase 4: Documentation | 1 hour | Pending |
| **Total** | **6-13 hours** | |

---

## Appendix

### Key Files

**Library**:
- `src/core/SysExParser.ts` - Contains buildCustomModeWriteRequest
- `src/device/DeviceManager.ts` - Calls SysEx builder

**Web App**:
- `src/pages/Editor.tsx` - UI logic for send/fetch operations
- `src/contexts/LCXL3Context.tsx` - Device connection management
- `src/utils/slotPersistence.ts` - Slot state persistence

**Tests**:
- `tests/e2e/slot-persistence.spec.ts` - E2E test (to be created)
- `utils/test-slot-copy.ts` - Library integration test (existing)

### Diagnostic Commands

```bash
# Check installed package version
cat node_modules/@oletizi/launch-control-xl3/package.json | grep version

# Check if package is symlinked
readlink node_modules/@oletizi/launch-control-xl3

# Find buildCustomModeWriteRequest in package
find node_modules/@oletizi/launch-control-xl3 -name "*.js" -exec grep -l "buildCustomModeWriteRequest" {} \;

# Check Vite cache
ls -la node_modules/.vite/deps

# Verify library link
pnpm list @oletizi/launch-control-xl3
```

---

**Plan Created**: 2025-10-13
**Last Updated**: 2025-10-13
**Status**: Ready for execution
