# Vitest Test Infrastructure Setup Instructions

## Phase 1: Infrastructure Setup (Current Status)

### Files Created

The following files have been created for the Vitest test infrastructure:

1. **vitest.config.ts** - Main Vitest configuration
   - Location: `/Users/orion/work/xl3-web/vitest.config.ts`
   - Configured with React plugin, jsdom environment, and coverage thresholds

2. **src/test/setup.ts** - Test setup file
   - Location: `/Users/orion/work/xl3-web/src/test/setup.ts`
   - Extends Vitest with jest-dom matchers and cleanup

3. **package.json** - Updated with test scripts
   - Added: `test`, `test:ui`, `test:coverage`, `test:watch`, `test:ci`

## Next Steps: Install Dependencies

Run the following commands to complete the setup:

### 1. Install Vitest and Testing Libraries

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @types/testing-library__jest-dom jsdom
```

### 2. Verify Installation

After installation, verify that everything is installed correctly:

```bash
# Check installed versions
npm list vitest @testing-library/react

# Verify Vitest executable
npx vitest --version

# Check that node_modules contains vitest
ls -la node_modules/vitest
```

### 3. Create Test Directory Structure

```bash
# Create test directories
mkdir -p src/utils/__tests__
mkdir -p src/components/__tests__
mkdir -p src/hooks/__tests__

# Verify directories were created
ls -la src/utils/__tests__/
ls -la src/components/__tests__/
ls -la src/hooks/__tests__/
```

### 4. Validate Infrastructure

Run these commands to ensure everything works:

```bash
# Test that Vitest runs (will show "No test files found")
npm run test -- --run

# Test coverage command (will show 0% coverage)
npm run test:coverage

# Test UI mode (will open browser)
npm run test:ui
```

### 5. Verify File Contents

Run these commands to verify all files were created correctly:

```bash
# Verify vitest.config.ts
cat vitest.config.ts | head -20

# Verify test setup
cat src/test/setup.ts

# Verify package.json scripts
cat package.json | grep -A 6 '"test":'
```

## Expected Output

After running the installation and verification commands, you should see:

1. **npm install output**: Package installation logs
2. **npx vitest --version**: Version number (e.g., "vitest version 2.0.x")
3. **npm list output**: Dependency tree showing installed packages
4. **npm run test output**: "No test files found" (expected at this stage)
5. **Directory listing**: Confirmation of test directories

## Configuration Details

### Vitest Configuration Highlights

- **Test Environment**: jsdom (for DOM testing)
- **Global API**: Enabled (no need to import describe, it, expect)
- **Coverage Provider**: v8 (faster than istanbul)
- **Coverage Thresholds**: 80% for statements, branches, functions, and lines
- **Path Alias**: @/ resolves to ./src/

### Test Scripts Available

- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests and generate coverage report
- `npm run test:watch` - Explicitly run in watch mode
- `npm run test:ci` - Run tests with verbose output for CI/CD

## Troubleshooting

### If installation fails:

1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json: `rm package-lock.json`
4. Reinstall: `npm install`
5. Retry Vitest installation

### If Vitest doesn't run:

1. Check Node.js version: `node --version` (should be >= 18)
2. Verify vitest.config.ts has no syntax errors: `npx tsc --noEmit vitest.config.ts`
3. Check that jsdom is installed: `npm list jsdom`

### If coverage doesn't work:

1. Verify @vitest/coverage-v8 is installed: `npm list @vitest/coverage-v8`
2. Check coverage config in vitest.config.ts
3. Run with debug: `npm run test:coverage -- --reporter=verbose`

## What's Next?

Once the infrastructure is validated:

1. **Phase 2**: Write utility function tests
2. **Phase 3**: Write React component tests
3. **Phase 4**: Write hook tests
4. **Phase 5**: Integrate with CI/CD

## Success Criteria Checklist

- [ ] All dependencies installed (verified with `npm list`)
- [ ] vitest.config.ts exists and is valid
- [ ] src/test/setup.ts exists and is valid
- [ ] package.json scripts added and functional
- [ ] Test directories created
- [ ] `npx vitest --version` works
- [ ] `npm run test` executes without errors
- [ ] `npm run test:coverage` generates report

## File Verification Commands

Run these to verify everything is in place:

```bash
# List all test infrastructure files
ls -la vitest.config.ts
ls -la src/test/setup.ts
ls -la src/utils/__tests__/
ls -la src/components/__tests__/
ls -la src/hooks/__tests__/

# Count lines in config files
wc -l vitest.config.ts src/test/setup.ts

# Show first 10 lines of each config
head -10 vitest.config.ts
head -10 src/test/setup.ts
```

## Notes

- This is infrastructure setup only - no test files written yet
- The project uses React with TypeScript and Vite
- Existing plugin: @vitejs/plugin-react-swc (already in use)
- Path alias @/ is already configured in tsconfig.json
- Playwright is already set up for E2E tests (separate from unit tests)
