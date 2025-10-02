# Inline Edit Control Labels Implementation Workplan

**Status**: ✅ COMPLETE
**Date**: 2025-09-27
**Feature**: Feature 5 - Inline Edit Control Labels
**Test Results**: All 21 E2E tests passing (3 browsers × 7 tests)

## Specification Requirements (docs/EDITOR-SPECIFICATION.md)

### Feature 5.1: Users can edit control label in the device visualization inline
- [x] The control label for a control in the device visualization agrees with the control label value in the model data structure and in the control properties editor
- [x] When a user double-clicks on the control label for a control in the device visualization, it turns into a text editor
- [x] When the user presses return/enter, the control label value in the model data structure is updated with the value of the text editor, and the control label text editor display is swapped with the default label display

## Current State Analysis

### What EXISTS:
- ✅ ControllerVisual component displays all 48 controls with hardcoded labels
- ✅ Control labels show as "Knob {cc}", "Fader {cc}", "Button {cc}"
- ✅ selectedControl and onControlSelect props for control selection
- ✅ mode state in Editor.tsx with controls containing label property
- ✅ updateControlProperty function to update control properties
- ✅ Label field in Control Properties editor (Advanced tab)

### What is MISSING:
- ❌ ControllerVisual doesn't receive mode/controls data
- ❌ Labels in ControllerVisual don't reflect custom labels from model
- ❌ Double-click handler on labels to enter edit mode
- ❌ Inline text input for editing labels
- ❌ Enter key handler to save label changes
- ❌ Callback to update parent (Editor) state with new label

## Implementation Tasks

### Task 1: Pass Controls Data to ControllerVisual
**Files**:
- `src/pages/Editor.tsx` (modify)
- `src/components/editor/ControllerVisual.tsx` (modify)

**Changes needed**:
1. Add `controls` and `onLabelUpdate` props to ControllerVisual interface
2. Pass `mode.controls` and label update callback from Editor to ControllerVisual

**Example implementation**:
```typescript
// In Editor.tsx
const handleLabelUpdate = (controlId: string, newLabel: string) => {
  updateControlProperty('label', newLabel);
  // Temporarily select the control to trigger the update
  const prevSelected = selectedControl;
  setSelectedControl(controlId);
  setTimeout(() => setSelectedControl(prevSelected), 0);
};

<ControllerVisual
  selectedControl={selectedControl}
  onControlSelect={setSelectedControl}
  controls={mode.controls}
  onLabelUpdate={handleLabelUpdate}
/>
```

**Success criteria**:
- ControllerVisual receives controls data
- Component can access custom labels for each control

---

### Task 2: Display Custom Labels from Model
**File**: `src/components/editor/ControllerVisual.tsx`

**Changes needed**:
1. Update renderKnob, renderFader, renderButton to use custom labels
2. Fall back to default label if no custom label set
3. Show custom label or default label based on controls[id].label

**Example implementation**:
```typescript
// Get label for control
const getControlLabel = (controlId: string, defaultLabel: string) => {
  return controls[controlId]?.label || defaultLabel;
};

// In renderKnob
<text
  x={knob.x}
  y={knob.y + 60}
  textAnchor="middle"
  className="fill-foreground text-xs font-semibold"
>
  {getControlLabel(knob.id, `Knob ${knob.cc}`)}
</text>
```

**Success criteria**:
- Labels display custom values from model
- Labels fall back to defaults when not customized
- Labels sync with Control Properties editor

---

### Task 3: Add Double-Click Edit Mode
**File**: `src/components/editor/ControllerVisual.tsx`

**Changes needed**:
1. Add state for editing control ID and edit value
2. Add double-click handler to text elements
3. Render input when in edit mode
4. Render text when not in edit mode

**Example implementation**:
```typescript
const [editingControl, setEditingControl] = useState<string | null>(null);
const [editValue, setEditValue] = useState("");

const handleLabelDoubleClick = (controlId: string, currentLabel: string) => {
  setEditingControl(controlId);
  setEditValue(currentLabel);
};

// In renderKnob
{editingControl === knob.id ? (
  <foreignObject x={knob.x - 30} y={knob.y + 50} width="60" height="20">
    <input
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => handleKeyDown(e, knob.id)}
      onBlur={() => setEditingControl(null)}
      autoFocus
      className="w-full text-xs text-center bg-background border border-primary rounded px-1"
    />
  </foreignObject>
) : (
  <text
    x={knob.x}
    y={knob.y + 60}
    textAnchor="middle"
    className="fill-foreground text-xs font-semibold cursor-pointer hover:fill-primary"
    onDoubleClick={() => handleLabelDoubleClick(knob.id, getControlLabel(knob.id, `Knob ${knob.cc}`))}
  >
    {getControlLabel(knob.id, `Knob ${knob.cc}`)}
  </text>
)}
```

**Success criteria**:
- Double-clicking label enters edit mode
- Input appears with current label value
- Input is focused automatically

---

### Task 4: Save Label on Enter Key
**File**: `src/components/editor/ControllerVisual.tsx`

**Changes needed**:
1. Add Enter key handler
2. Call onLabelUpdate callback with new value
3. Exit edit mode
4. Handle Escape key to cancel

**Example implementation**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent, controlId: string) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    onLabelUpdate(controlId, editValue);
    setEditingControl(null);
  } else if (e.key === 'Escape') {
    setEditingControl(null);
  }
};
```

**Success criteria**:
- Pressing Enter saves the label
- Label updates in model
- Label updates in visualization
- Label updates in Control Properties editor
- Pressing Escape cancels edit

---

### Task 5: Verification with Playwright MCP

**Test Scenarios**:

**Test 1: Labels sync with model**
1. Navigate to http://localhost:8081/
2. Click CC 13 knob
3. Go to Advanced tab in properties
4. Change label to "Bass Cut"
5. Verify label in visualization shows "Bass Cut"
6. Verify label in properties shows "Bass Cut"

**Test 2: Double-click enters edit mode**
1. Navigate to http://localhost:8081/
2. Double-click on "Knob 13" label
3. Verify input field appears
4. Verify input is focused
5. Verify input shows current label

**Test 3: Enter saves label**
1. Navigate to http://localhost:8081/
2. Double-click "Knob 13" label
3. Type "Volume"
4. Press Enter
5. Verify visualization shows "Volume"
6. Click CC 13 knob
7. Verify properties editor shows "Volume"
8. Reload page
9. Verify label persists as "Volume"

**Test 4: Escape cancels edit**
1. Navigate to http://localhost:8081/
2. Double-click "Knob 13" label
3. Type "Test"
4. Press Escape
5. Verify label reverts to original

**Test 5: Multiple controls have independent labels**
1. Double-click "Knob 13", type "Vol 1", press Enter
2. Double-click "Knob 14", type "Vol 2", press Enter
3. Double-click "Fader 5", type "Master", press Enter
4. Verify all three labels persist correctly
5. Reload page
6. Verify all labels still show correctly

**Success criteria**:
- All tests pass
- Labels sync across visualization and properties
- Edit mode works correctly
- State persists across reloads

---

### Task 6: Write E2E Test
**File**: Create `tests/e2e/feature-5-inline-label-edit.spec.ts`

**Test Coverage**:
1. Labels sync with model (change in properties, verify in visualization)
2. Double-click enters edit mode
3. Enter key saves label
4. Escape key cancels edit
5. Labels persist across page reload
6. Multiple controls can have custom labels

**Success criteria**:
- All E2E tests pass across 3 browsers
- Full coverage of Feature 5 requirements

---

## Implementation Order

1. **Task 1** - Pass controls data to ControllerVisual
2. **Task 2** - Display custom labels from model
3. **Task 3** - Add double-click edit mode
4. **Task 4** - Save label on Enter key
5. **Task 5** - Verify with Playwright MCP
6. **Task 6** - Write E2E test

## Testing Approach

### Manual Testing Steps:

**Label Sync Test:**
1. Open editor at http://localhost:8081/
2. Click CC 13 knob
3. Go to Advanced tab
4. Change Control Label to "My Label"
5. Verify visualization shows "My Label"

**Inline Edit Test:**
1. Double-click "Knob 13" label in visualization
2. Type "Custom Name"
3. Press Enter
4. Verify label changes to "Custom Name"
5. Click CC 13 knob
6. Verify properties show "Custom Name"

**Persistence Test:**
1. Set custom label via inline edit
2. Reload page
3. Verify label persists

---

**Next Step**: Begin Task 1 (Pass controls data to ControllerVisual)