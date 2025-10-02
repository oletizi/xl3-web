#!/bin/bash

echo "Verifying test files creation..."
echo "=================================="

echo ""
echo "📁 Test directory structure:"
ls -la tests/

echo ""
echo "📋 Test plan document (first 50 lines):"
head -50 tests/device-autoconnect.test-plan.md

echo ""
echo "📁 E2E test directory:"
ls -la tests/e2e/

echo ""
echo "📁 E2E helpers directory:"
ls -la tests/e2e/helpers/

echo ""
echo "🧪 Basic test file (first 20 lines):"
head -20 tests/e2e/device-autoconnect-basic.spec.ts

echo ""
echo "⚙️ Playwright config:"
ls -la playwright.config.ts

echo ""
echo "📦 Package.json test scripts:"
grep -A 10 "test:" package.json

echo ""
echo "✅ Verification complete!"