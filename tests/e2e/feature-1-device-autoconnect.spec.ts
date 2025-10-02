import { test, expect } from '@playwright/test';

/**
 * Feature 1: Device MIDI Auto-Connect
 *
 * Tests that the web app automatically connects to the Launch Control XL3
 * device when it loads or when a new device is connected.
 *
 * Requirements:
 * - App detects device, if connected
 * - App initiates MIDI SysEx handshake
 * - On successful handshake, connection status switches from "Disconnected" to "Connected"
 *
 * NOTE: This test requires a physical Launch Control XL3 device to be connected.
 * If no device is connected, the test will fail.
 */

test.describe('Feature 1: Device MIDI Auto-Connect', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant MIDI permissions
    await context.grantPermissions(['midi-sysex', 'midi']);

    // Navigate to the editor page
    await page.goto('http://localhost:8081/');
  });

  test('should auto-connect to LCXL3 device and update connection status', async ({ page }) => {
    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();

    // Find the connection button (it's in the top nav)
    const connectionButton = page.locator('button').filter({ hasText: /Disconnected|Connected/i }).first();

    // Wait for auto-connect to complete (max 10 seconds)
    // The connection status should change from "Disconnected" to "Connected: LCXL3 1 MIDI"
    await expect(connectionButton).toContainText('Connected', { timeout: 10000 });

    // Verify the full connection status text includes the device name
    await expect(connectionButton).toContainText('LCXL3 1 MIDI');

    // Give time for console logs to accumulate
    await page.waitForTimeout(500);

    // Check that handshake logs are present
    const hasHandshakeLogs = consoleLogs.some(log =>
      log.includes('LCXL3 handshake successful') ||
      log.includes('Sent device inquiry')
    );

    expect(hasHandshakeLogs).toBeTruthy();
  });

  test('should show correct connection state in UI', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();

    // Find the connection button
    const connectionButton = page.locator('button').filter({ hasText: /Connected/i }).first();
    await expect(connectionButton).toBeVisible({ timeout: 10000 });

    // Verify the button shows connected state with device name
    const hasConnectedText = await connectionButton.evaluate((el) => {
      const text = el.textContent || '';
      return text.includes('Connected') && text.includes('LCXL3');
    });

    expect(hasConnectedText).toBeTruthy();
  });

  test('should maintain connection throughout page interaction', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();

    // Wait for initial connection
    const connectionButton = page.locator('button').filter({ hasText: /Connected/i }).first();
    await expect(connectionButton).toContainText('Connected', { timeout: 10000 });

    // Interact with the page (click different controls)
    await page.getByRole('textbox', { name: 'Mode Name' }).fill('Test Mode');

    // Verify connection status is still "Connected" after interaction
    await expect(connectionButton).toContainText('Connected');
    await expect(connectionButton).toContainText('LCXL3');
  });
});