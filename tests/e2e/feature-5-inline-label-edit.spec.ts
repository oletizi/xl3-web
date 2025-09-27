import { test, expect } from '@playwright/test';

/**
 * Feature 5: Inline Edit Control Labels
 *
 * Tests that users can edit control labels inline in the device visualization
 * by double-clicking on them.
 *
 * Requirements:
 * 5.1.1 - The control label for a control in the device visualization agrees with
 *         the control label value in the model data structure and in the control properties editor
 * 5.1.2 - When a user double-clicks on the control label for a control in the device visualization,
 *         it turns into a text editor
 * 5.1.3 - When the user presses return/enter, the control label value in the model data structure
 *         is updated with the value of the text editor, and the control label text editor display
 *         is swapped with the default label display
 */

test.describe('Feature 5: Inline Edit Control Labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/');
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
  });

  test('5.1.1 - should sync labels between visualization and properties editor', async ({ page }) => {
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByRole('tab', { name: 'Advanced' }).click();

    const controlLabelInput = page.getByRole('textbox', { name: 'Control Label' });
    await controlLabelInput.fill('Bass Cut');

    await page.waitForTimeout(500);

    const labelInVisualization = await page.locator('svg text').filter({ hasText: 'Bass Cut' }).count();
    expect(labelInVisualization).toBeGreaterThan(0);

    await expect(controlLabelInput).toHaveValue('Bass Cut');
  });

  test('5.1.2 - should enter edit mode on double-click', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob13Label = texts.find(t => t.textContent?.includes('Knob 13'));
      if (knob13Label) {
        knob13Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    const inlineInput = page.locator('svg foreignObject input[type="text"]');
    await expect(inlineInput).toBeVisible();
    await expect(inlineInput).toHaveValue('Knob 13');
  });

  test('5.1.3 - should save label on Enter key and sync to properties editor', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob13Label = texts.find(t => t.textContent?.includes('Knob 13'));
      if (knob13Label) {
        knob13Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    const inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Volume');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    const labelCount = await page.locator('svg text').filter({ hasText: 'Volume' }).count();
    expect(labelCount).toBeGreaterThan(0);

    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      circles[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByRole('tab', { name: 'Advanced' }).click();
    await expect(page.getByRole('textbox', { name: 'Control Label' })).toHaveValue('Volume');
  });

  test('should handle Escape key to cancel edit', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob13Label = texts.find(t => t.textContent?.includes('Knob 13'));
      if (knob13Label) {
        knob13Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    const inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Should Not Save');
    await inlineInput.press('Escape');

    await page.waitForTimeout(300);

    const labelCount = await page.locator('svg text').filter({ hasText: 'Knob 13' }).count();
    expect(labelCount).toBeGreaterThan(0);

    const notSavedCount = await page.locator('svg text').filter({ hasText: 'Should Not Save' }).count();
    expect(notSavedCount).toBe(0);
  });

  test('should support independent labels for multiple controls', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob13Label = texts.find(t => t.textContent?.includes('Knob 13'));
      if (knob13Label) {
        knob13Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    let inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Vol 1');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob14Label = texts.find(t => t.textContent?.includes('Knob 14'));
      if (knob14Label) {
        knob14Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Vol 2');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    const vol1Count = await page.locator('svg text').filter({ hasText: 'Vol 1' }).count();
    const vol2Count = await page.locator('svg text').filter({ hasText: 'Vol 2' }).count();

    expect(vol1Count).toBeGreaterThan(0);
    expect(vol2Count).toBeGreaterThan(0);
  });

  test('should persist labels across page reload', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const knob13Label = texts.find(t => t.textContent?.includes('Knob 13'));
      if (knob13Label) {
        knob13Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    const inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Persistent Label');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();

    const labelCount = await page.locator('svg text').filter({ hasText: 'Persistent Label' }).count();
    expect(labelCount).toBeGreaterThan(0);
  });

  test('should work with faders and buttons', async ({ page }) => {
    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const fader5Label = texts.find(t => t.textContent?.includes('Fader 5'));
      if (fader5Label) {
        fader5Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    let inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Master');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    const masterCount = await page.locator('svg text').filter({ hasText: 'Master' }).count();
    expect(masterCount).toBeGreaterThan(0);

    await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('svg text'));
      const button37Label = texts.find(t => t.textContent?.includes('Button 37'));
      if (button37Label) {
        button37Label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    inlineInput = page.locator('svg foreignObject input[type="text"]');
    await inlineInput.fill('Mute');
    await inlineInput.press('Enter');

    await page.waitForTimeout(300);

    const muteCount = await page.locator('svg text').filter({ hasText: 'Mute' }).count();
    expect(muteCount).toBeGreaterThan(0);
  });
});