import { test, expect } from '@playwright/test';

test.describe('Feature 6: Fetch Mode from Device', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/');
    await page.waitForLoadState('networkidle');
  });

  test('6.0.1 - Fetch button exists and is positioned before Send button', async ({ page }) => {
    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    const sendButton = page.getByRole('button', { name: 'Send' });

    await expect(fetchButton).toBeVisible();
    await expect(sendButton).toBeVisible();

    const fetchBox = await fetchButton.boundingBox();
    const sendBox = await sendButton.boundingBox();

    expect(fetchBox).not.toBeNull();
    expect(sendBox).not.toBeNull();
    expect(fetchBox!.x).toBeLessThan(sendBox!.x);
  });

  test('6.0.2 - Fetch and Send buttons reflect connection state', async ({ page }) => {
    const connectionStatus = page.locator('button').filter({ hasText: /Connected|Disconnected/ });
    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    const sendButton = page.getByRole('button', { name: 'Send' });

    const statusText = await connectionStatus.textContent();

    if (statusText?.includes('Connected')) {
      await expect(fetchButton).toBeEnabled();
      await expect(sendButton).toBeEnabled();
    } else {
      await expect(fetchButton).toBeDisabled();
      await expect(sendButton).toBeDisabled();
    }
  });

  test('6.1.1 - Clicking Fetch shows appropriate toast notification', async ({ page }) => {
    const connectionStatus = page.locator('button').filter({ hasText: /Connected|Disconnected/ });
    const statusText = await connectionStatus.textContent();

    if (!statusText?.includes('Connected')) {
      test.skip();
    }

    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    await fetchButton.click();

    await page.waitForTimeout(500);

    const toastRegion = page.getByRole('region', { name: /Notifications/ }).first();
    const toastText = await toastRegion.textContent();

    expect(toastText).toContain('Fetching mode from device');
  });

  test('6.1.2 - Fetch error handling shows error toast', async ({ page }) => {
    const connectionStatus = page.locator('button').filter({ hasText: /Connected|Disconnected/ });
    const statusText = await connectionStatus.textContent();

    if (!statusText?.includes('Connected')) {
      test.skip();
    }

    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    await fetchButton.click();

    await page.waitForTimeout(1000);

    const toastRegion = page.getByRole('region', { name: /Notifications/ }).first();
    const toastText = await toastRegion.textContent();

    expect(toastText).toMatch(/Fetch failed|not yet implemented/i);
  });

  test('6.1.3 - App remains stable after fetch error', async ({ page }) => {
    const connectionStatus = page.locator('button').filter({ hasText: /Connected|Disconnected/ });
    const statusText = await connectionStatus.textContent();

    if (!statusText?.includes('Connected')) {
      test.skip();
    }

    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    await fetchButton.click();

    await page.waitForTimeout(1500);

    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
    await expect(fetchButton).toBeEnabled();

    const knobLabel = page.locator('svg text').filter({ hasText: 'Bass Cut' });
    await expect(knobLabel).toBeVisible();
  });

  test('6.0.3 - Buttons have correct styling and are distinguishable', async ({ page }) => {
    const fetchButton = page.getByRole('button', { name: 'Fetch' });
    const sendButton = page.getByRole('button', { name: 'Send' });

    await expect(fetchButton).toBeVisible();
    await expect(sendButton).toBeVisible();

    const fetchClasses = await fetchButton.getAttribute('class');
    const sendClasses = await sendButton.getAttribute('class');

    expect(fetchClasses).toBeTruthy();
    expect(sendClasses).toBeTruthy();
    expect(fetchClasses).not.toBe(sendClasses);
  });
});