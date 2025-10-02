import { test, expect } from '@playwright/test';

/**
 * Feature 4: State Persistence
 *
 * Tests that the editor persists state to localStorage and can reload it,
 * and that the reset button clears the state properly.
 *
 * Requirements:
 * 4.1 - The model data structure is persistent such that changes made to it
 *       in the editor are available when the user returns to the editor
 * 4.2 - The model data structure is reset to default values when the reset button is pressed
 */

test.describe('Feature 4: State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/');
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
  });

  test('4.1 - should persist state across page reloads', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Mode Name' }).fill('Persistent Test Mode');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    const ccNumberInput = page.getByRole('spinbutton', { name: 'CC Number' });
    await ccNumberInput.fill('99');

    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('Persistent Test Mode');
    await expect(ccNumberInput).toHaveValue('99');

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('Persistent Test Mode');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    await expect(ccNumberInput).toHaveValue('99');
  });

  test('4.2 - should reset state to defaults when reset button is pressed', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Mode Name' }).fill('Test Mode');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    const ccNumberInput = page.getByRole('spinbutton', { name: 'CC Number' });
    await ccNumberInput.fill('77');

    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('Test Mode');
    await expect(ccNumberInput).toHaveValue('77');

    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByText('Mode reset to defaults')).toBeVisible();

    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('New Custom Mode');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    await expect(ccNumberInput).toHaveValue('13');
  });

  test('should persist multiple property changes', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Mode Name' }).fill('Multi Property Test');
    await page.getByRole('textbox', { name: 'Description' }).fill('Testing multiple properties');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      knob.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByRole('spinbutton', { name: 'CC Number' }).fill('88');
    await page.getByRole('spinbutton', { name: 'MIDI Channel' }).fill('5');
    await page.getByRole('spinbutton', { name: 'Min Value' }).fill('10');
    await page.getByRole('spinbutton', { name: 'Max Value' }).fill('100');

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('Multi Property Test');
    await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue('Testing multiple properties');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      knob.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('88');
    await expect(page.getByRole('spinbutton', { name: 'MIDI Channel' })).toHaveValue('5');
    await expect(page.getByRole('spinbutton', { name: 'Min Value' })).toHaveValue('10');
    await expect(page.getByRole('spinbutton', { name: 'Max Value' })).toHaveValue('100');
  });

  test('should persist changes to multiple controls', async ({ page }) => {
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByRole('spinbutton', { name: 'CC Number' }).fill('91');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '240' &&
            circle.getAttribute('cy') === '120' &&
            circle.getAttribute('r') === '18') {
          circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        }
      }
    });

    await page.getByRole('spinbutton', { name: 'CC Number' }).fill('92');

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('91');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '240' &&
            circle.getAttribute('cy') === '120' &&
            circle.getAttribute('r') === '18') {
          circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        }
      }
    });

    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('92');
  });

  test('should clear localStorage on reset', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Mode Name' }).fill('Will Be Cleared');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByRole('spinbutton', { name: 'CC Number' }).fill('50');

    await page.getByRole('button', { name: 'Reset' }).click();

    const storageCleared = await page.evaluate(() => {
      const stored = localStorage.getItem('lcxl3-editor-mode');
      return stored === null || JSON.parse(stored).name === 'New Custom Mode';
    });

    expect(storageCleared).toBeTruthy();

    await page.reload();

    await expect(page.getByRole('textbox', { name: 'Mode Name' })).toHaveValue('New Custom Mode');

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('13');
  });
});