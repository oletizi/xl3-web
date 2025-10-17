# modeConverter.ts Test Requirements

**Created**: 2025-10-17
**Branch**: `test/achieve-80-percent-coverage`
**Priority**: 🔴 **P0 - CRITICAL**
**Target Coverage**: 100%

## Overview

This document specifies the comprehensive test requirements for `src/utils/modeConverter.ts`, focusing on preventing regression of the recent production bug where name truncation was incorrectly limited to 8 characters instead of 18.

## Known Bug Details

### The Bug
**Date Discovered**: October 2025
**Symptom**: Mode names were being truncated to 8 characters instead of 18
**Root Cause**: Incorrect string length constant in truncation logic
**Impact**: Production - User mode names were incorrectly shortened
**Prevention**: This bug should have been caught by unit tests

### Example of Bug Behavior

```typescript
// ❌ BUG BEHAVIOR (8 char limit)
const input = "VeryLongModeName12345";
const output = truncate(input, 8);
// Result: "VeryLong" (WRONG)

// ✅ CORRECT BEHAVIOR (18 char limit)
const input = "VeryLongModeName12345";
const output = truncate(input, 18);
// Result: "VeryLongModeName12" (CORRECT)
```

## Comprehensive Test Requirements

### Test File Location
**File**: `src/utils/__tests__/modeConverter.test.ts`

### Required Test Suites

#### Suite 1: Name Truncation (Bug Prevention)

**Purpose**: Prevent regression of the 8→18 character bug

##### Test Cases

1. **Truncate to Exactly 18 Characters**
   ```typescript
   it('should truncate names to exactly 18 characters', () => {
     const longName = 'ThisIsAVeryLongModeNameThatExceeds18Characters';
     const result = convertMode({ name: longName });

     expect(result.name.length).toBe(18);
     expect(result.name).toBe('ThisIsAVeryLongMod');
   });
   ```

2. **Do Not Truncate 18-Character Names**
   ```typescript
   it('should NOT truncate names of exactly 18 characters', () => {
     const exactName = 'ExactlyEighteen!!';
     expect(exactName.length).toBe(18);

     const result = convertMode({ name: exactName });
     expect(result.name).toBe(exactName);
   });
   ```

3. **Do Not Truncate Short Names**
   ```typescript
   it('should NOT truncate names shorter than 18 characters', () => {
     const shortName = 'ShortMode';
     const result = convertMode({ name: shortName });
     expect(result.name).toBe(shortName);
   });
   ```

4. **Boundary: 17 Characters (No Truncation)**
   ```typescript
   it('should NOT truncate 17-character names', () => {
     const name17 = 'SeventeenCharName';
     expect(name17.length).toBe(17);

     const result = convertMode({ name: name17 });
     expect(result.name).toBe(name17);
   });
   ```

5. **Boundary: 19 Characters (Truncation)**
   ```typescript
   it('should truncate 19-character names to 18', () => {
     const name19 = 'NineteenCharacters!';
     expect(name19.length).toBe(19);

     const result = convertMode({ name: name19 });
     expect(result.name.length).toBe(18);
     expect(result.name).toBe('NineteenCharacters');
   });
   ```

6. **Verify NOT 8 Characters (Explicit Bug Check)**
   ```typescript
   it('should NOT truncate to 8 characters (bug regression test)', () => {
     const longName = 'VeryLongModeName12345';
     const result = convertMode({ name: longName });

     // Explicit check that we're NOT using 8 char limit
     expect(result.name.length).not.toBe(8);
     expect(result.name).not.toBe('VeryLong');

     // Verify correct 18 char limit
     expect(result.name.length).toBe(18);
     expect(result.name).toBe('VeryLongModeName12');
   });
   ```

#### Suite 2: Edge Cases

7. **Empty String**
8. **Single Character**
9. **Whitespace Only**
10. **Special Characters**
11. **Unicode and Emoji**

#### Suite 3: Full Mode Conversion

12. **Preserve Non-Name Properties**
13. **Truncate Name While Preserving Other Properties**

#### Suite 4: Error Handling

14. **Null Input**
15. **Undefined Input**
16. **Missing Name Property**
17. **Invalid Name Type**

## Coverage Requirements

### Minimum Coverage Targets
- **Statement Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%
- **Line Coverage**: 100%

### Critical Coverage Areas
- ✅ Name truncation logic (18 char limit)
- ✅ All boundary conditions (17, 18, 19 chars)
- ✅ Error handling paths
- ✅ Edge cases (empty, unicode, special chars)
- ✅ Property preservation during conversion

## Implementation Checklist

- [ ] Create test file: `src/utils/__tests__/modeConverter.test.ts`
- [ ] Implement Suite 1: Name Truncation (6 tests)
- [ ] Implement Suite 2: Edge Cases (5 tests)
- [ ] Implement Suite 3: Full Conversion (2 tests)
- [ ] Implement Suite 4: Error Handling (4 tests)
- [ ] Run tests: `npm run test modeConverter.test.ts`
- [ ] Check coverage: `npm run test:coverage -- src/utils/modeConverter.ts`
- [ ] Verify 100% coverage achieved
- [ ] Code review by @code-reviewer

## Success Criteria

✅ **Test Suite Complete** when:
1. All 17+ test cases implemented and passing
2. 100% coverage achieved (statements, branches, functions, lines)
3. Bug regression test explicitly included (Test #6)
4. All edge cases covered
5. Error handling comprehensive
6. Code review approved

✅ **Bug Prevention Validated** when:
1. Test #6 explicitly checks 18 char limit (not 8)
2. Boundary tests cover 17, 18, 19 characters
3. Tests would fail if 8 char limit were used
4. All truncation tests pass with current implementation

## Timeline

**Day 1**: Complete modeConverter.ts test coverage (100%)

**Total Time**: 1 day for modeConverter.ts complete test coverage

---

**Document Status**: ✅ Ready for Implementation
**Priority**: P0 - CRITICAL
**Next Steps**:
1. Approve this specification
2. Implement test file following this spec
3. Verify 100% coverage
4. Code review
