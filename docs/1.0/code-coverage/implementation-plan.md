# Test Coverage Implementation Plan

**Created**: 2025-10-17
**Branch**: `test/achieve-80-percent-coverage`
**Goal**: Achieve ≥80% test coverage with high-quality tests
**Timeline**: 4 weeks (phased approach)

## Overview

This document outlines the step-by-step implementation plan to achieve 80% test coverage across the xl3-web codebase, with special focus on preventing bugs like the recent modeConverter name truncation issue.

## Prerequisites

- ✅ Branch created: `test/achieve-80-percent-coverage`
- ✅ Coverage analysis completed (see `coverage-analysis.md`)
- ⏳ Approval from architect-reviewer and code-reviewer
- ⏳ Test infrastructure setup (Phase 1 below)

## Phase 1: Test Infrastructure Setup (Days 1-2)

### 1.1 Install Test Dependencies

```bash
# Install Vitest and testing libraries
npm install -D vitest @vitest/ui @vitest/coverage-v8

# Install React testing utilities
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install type definitions
npm install -D @types/testing-library__jest-dom
```

**Verification**:
```bash
npm list vitest @testing-library/react
ls -la node_modules/vitest
```

### 1.2 Create Vitest Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
      exclude: [
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.3 Create Test Setup File

**File**: `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### 1.4 Update Package Scripts

**File**: `package.json` (add to scripts section)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

### 1.5 Create Test Directory Structure

```bash
mkdir -p src/test
mkdir -p src/utils/__tests__
mkdir -p src/components/__tests__
mkdir -p src/hooks/__tests__
```

**Verification**:
```bash
ls -la src/test/
ls -la src/utils/__tests__/
tree src -d -L 2
```

### 1.6 Validation

```bash
# Verify configuration
npx vitest --version

# Run empty test suite (should pass)
npm run test

# Generate initial coverage report
npm run test:coverage
```

**Expected Output**: Coverage at 0% initially, but infrastructure working.

---

## Phase 2: Critical Module Testing (Days 3-7)

### Priority 0: modeConverter.ts (Day 3)

**Target**: 100% coverage - This module had a production bug

#### Test File Creation

**File**: `src/utils/__tests__/modeConverter.test.ts`

**Test Categories Required**:

1. **Name Truncation Tests** (Bug Prevention)
   - Test exact 18-character limit
   - Test names < 18 chars (no truncation)
   - Test names > 18 chars (proper truncation)
   - Test boundary conditions (17, 18, 19 chars)

2. **Edge Cases**
   - Empty strings
   - Null/undefined inputs
   - Special characters
   - Unicode/multi-byte characters

3. **Integration Tests**
   - Full mode conversion workflow
   - Preserve non-name properties
   - Error handling

**Success Criteria**:
- ✅ 100% statement coverage
- ✅ 100% branch coverage
- ✅ All edge cases tested
- ✅ Bug regression test included

**Implementation Steps**:
```bash
# 1. Create test file
touch src/utils/__tests__/modeConverter.test.ts

# 2. Implement tests (see test-patterns.md)

# 3. Run tests
npm run test src/utils/__tests__/modeConverter.test.ts

# 4. Check coverage
npm run test:coverage -- src/utils/modeConverter.ts

# 5. Verify 100% coverage achieved
```

### Priority 1: Other Utility Modules (Days 4-5)

**Target**: 95%+ coverage for all utility modules

#### Identify All Utility Modules

```bash
# List all utility files
find src/utils -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts"
```

#### Create Test Files for Each

For each utility module:
```bash
# Example: src/utils/deviceHelpers.ts
touch src/utils/__tests__/deviceHelpers.test.ts

# Implement tests following patterns from modeConverter.test.ts
# Run and verify coverage
npm run test:coverage -- src/utils/deviceHelpers.ts
```

**Success Criteria**:
- ✅ All utility modules have test files
- ✅ 95%+ coverage for each module
- ✅ All public functions tested
- ✅ Error paths covered

### Priority 2: Custom Hooks (Days 6-7)

**Target**: 85%+ coverage

**Success Criteria**:
- ✅ All hooks have test files
- ✅ 85%+ coverage for each hook
- ✅ State changes tested
- ✅ Effect side effects verified

---

## Phase 3: Component Testing (Days 8-14)

### 3.1 Component Testing Strategy

**Target**: 80%+ coverage

#### Testing Priorities

1. **Logic-Heavy Components** (P0)
   - Components with complex state management
   - Event handlers
   - Data transformations

2. **User-Facing Components** (P1)
   - Form components
   - Interactive controls
   - Navigation elements

3. **Display Components** (P2)
   - Pure presentational components
   - Simple data display

### 3.2 Implementation Schedule

**Week 2 (Days 8-14)**:
- Day 8: Set up component test infrastructure
- Days 9-10: Test logic-heavy components (P0)
- Days 11-12: Test user-facing components (P1)
- Days 13-14: Test display components (P2)

**Daily Process**:
```bash
# 1. Identify components to test
ls src/components/*.tsx

# 2. Create test files
touch src/components/__tests__/[Component].test.tsx

# 3. Implement tests (see test-patterns.md)

# 4. Run tests and check coverage
npm run test:coverage -- src/components/

# 5. Review and adjust
```

---

## Phase 4: Integration & API Testing (Days 15-21)

### 4.1 API Testing Strategy

**Target**: 75%+ coverage

### 4.2 Implementation Schedule

**Week 3 (Days 15-21)**:
- Days 15-16: Set up MSW for API mocking
- Days 17-18: Test API client functions
- Days 19-20: Test integration points
- Day 21: Integration test review

---

## Phase 5: Coverage Validation & CI Integration (Days 22-28)

### 5.1 Coverage Validation

**Day 22-23**: Coverage Review
```bash
# Generate full coverage report
npm run test:coverage

# Review HTML report
open coverage/index.html

# Identify gaps
npm run test:coverage -- --reporter=verbose
```

**Acceptance Criteria**:
- ✅ Overall coverage ≥ 80%
- ✅ Critical modules ≥ 95%
- ✅ No module < 60%

### 5.2 CI/CD Integration

**Day 24-25**: GitHub Actions Setup

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, test/achieve-80-percent-coverage]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Check coverage
        run: npm run test:coverage
```

### 5.3 Pre-commit Hooks

**Day 26**: Set up testing hooks

```bash
# Install husky
npm install -D husky

# Initialize
npx husky init

# Add pre-commit hook
echo "npm run test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 5.4 Documentation

**Day 27-28**: Update documentation

- Update README.md with testing instructions
- Create TESTING.md with guidelines
- Document test patterns
- Add contributing guidelines for tests

---

## Success Metrics

### Quantitative Goals

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Overall Coverage | 0% | ≥80% | 🔴 Not Started |
| Utility Coverage | 0% | ≥95% | 🔴 Not Started |
| Component Coverage | 0% | ≥80% | 🔴 Not Started |
| Hook Coverage | 0% | ≥85% | 🔴 Not Started |
| API Coverage | 0% | ≥75% | 🔴 Not Started |

### Qualitative Goals

- ✅ Tests catch known bugs (modeConverter regression test)
- ✅ Fast test execution (< 10s full suite)
- ✅ Clear failure messages
- ✅ Easy to add new tests
- ✅ CI/CD integration working
- ✅ Team adoption and compliance

---

## Rollout Plan

### Week 1: Foundation
- ✅ Set up infrastructure
- ✅ Test critical utilities (modeConverter)
- ✅ Establish patterns

### Week 2: Core Coverage
- ✅ Test all utilities
- ✅ Test custom hooks
- ✅ Begin component testing

### Week 3: Comprehensive Coverage
- ✅ Complete component testing
- ✅ Integration testing
- ✅ API testing

### Week 4: Polish & Integration
- ✅ Coverage validation
- ✅ CI/CD setup
- ✅ Documentation
- ✅ Team training

---

**Document Status**: ✅ Ready for Implementation
**Prerequisites**: `coverage-analysis.md` (completed)
**Next Document**: `test-patterns.md`
