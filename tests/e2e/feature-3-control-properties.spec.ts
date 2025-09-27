import { test, expect } from '@playwright/test';

/**
 * Feature 3: Control Properties
 *
 * Tests that users can click on device controls and set their properties
 * in the properties editor.
 *
 * Requirements:
 * 3.1.1 - User can click on a control and the corresponding control properties editor loads
 * 3.1.2 - Control CC number in properties editor matches the control label in visual display
 * 3.1.3 - Property values in properties editor are updated to match the model data structure
 * 3.1.4 - When user changes control properties, the model data structure is updated accordingly
 */

test.describe('Feature 3: Control Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor page
    await page.goto('http://localhost:8081/');

    // Wait for the page to fully load
    await expect(page.getByRole('heading', { name: 'Mode Editor' })).toBeVisible();
  });

  test('3.1.1 - should load control properties editor when clicking a control', async ({ page }) => {
    // Initially, the properties panel should show "Select a control" message
    await expect(page.getByText('Select a control on the device to configure its properties')).toBeVisible();

    // Click on the first knob (CC 13) - using JavaScript to dispatch event
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      // Find CC 13 knob (cx=160, cy=120, r=18)
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '160' &&
            circle.getAttribute('cy') === '120' &&
            circle.getAttribute('r') === '18') {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          circle.dispatchEvent(event);
          break;
        }
      }
    });

    // Control Properties panel should load with tabs
    await expect(page.getByRole('tab', { name: 'Mapping' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Advanced' })).toBeVisible();

    // Should show control type badge
    await expect(page.getByText('Control Type')).toBeVisible();
  });

  test('3.1.2 - should display CC number matching the visual control label', async ({ page }) => {
    // Test CC 13 knob
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2]; // CC 13 is at index 2
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // The control type badge should show "CC 13"
    await expect(page.locator('text=CC 13').first()).toBeVisible();

    // The CC Number input should show "13"
    const ccNumberInput = page.getByRole('spinbutton', { name: 'CC Number' });
    await expect(ccNumberInput).toHaveValue('13');

    // Test a different control - CC 53 (middle row, first knob)
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '160' &&
            circle.getAttribute('cy') === '200' &&
            circle.getAttribute('r') === '18') {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          circle.dispatchEvent(event);
          break;
        }
      }
    });

    // Should now show CC 53
    await expect(page.locator('text=CC 53').first()).toBeVisible();
    await expect(ccNumberInput).toHaveValue('53');
  });

  test('3.1.3 - should display property values from model data structure', async ({ page }) => {
    // Click on CC 13 knob
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // Verify all default property values are displayed
    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('13');
    await expect(page.getByRole('spinbutton', { name: 'MIDI Channel' })).toHaveValue('1');
    await expect(page.getByRole('spinbutton', { name: 'Min Value' })).toHaveValue('0');
    await expect(page.getByRole('spinbutton', { name: 'Max Value' })).toHaveValue('127');
  });

  test('3.1.4 - should update model when changing control properties', async ({ page }) => {
    // Click on CC 13 knob
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // Change CC Number to 99
    const ccNumberInput = page.getByRole('spinbutton', { name: 'CC Number' });
    await ccNumberInput.fill('99');

    // Verify the value changed
    await expect(ccNumberInput).toHaveValue('99');

    // Switch to a different control (CC 14)
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '240' &&
            circle.getAttribute('cy') === '120' &&
            circle.getAttribute('r') === '18') {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          circle.dispatchEvent(event);
          break;
        }
      }
    });

    // Should show CC 14's default value
    await expect(ccNumberInput).toHaveValue('14');

    // Switch back to CC 13
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // The changed value should persist (still 99)
    await expect(ccNumberInput).toHaveValue('99');
  });

  test('should update all property fields and persist changes', async ({ page }) => {
    // Click on CC 13 knob
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // Change all properties
    await page.getByRole('spinbutton', { name: 'CC Number' }).fill('77');
    await page.getByRole('spinbutton', { name: 'MIDI Channel' }).fill('5');
    await page.getByRole('spinbutton', { name: 'Min Value' }).fill('10');
    await page.getByRole('spinbutton', { name: 'Max Value' }).fill('100');

    // Switch to CC 14
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      for (const circle of circles) {
        if (circle.getAttribute('cx') === '240' &&
            circle.getAttribute('cy') === '120' &&
            circle.getAttribute('r') === '18') {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true });
          circle.dispatchEvent(event);
          break;
        }
      }
    });

    // Switch back to CC 13
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      knob.dispatchEvent(event);
    });

    // All changes should persist
    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('77');
    await expect(page.getByRole('spinbutton', { name: 'MIDI Channel' })).toHaveValue('5');
    await expect(page.getByRole('spinbutton', { name: 'Min Value' })).toHaveValue('10');
    await expect(page.getByRole('spinbutton', { name: 'Max Value' })).toHaveValue('100');
  });

  test('should work with different control types (knobs, faders, buttons)', async ({ page }) => {
    // Test a knob (CC 13)
    await page.evaluate(() => {
      const circles = document.querySelectorAll('svg circle');
      const knob = circles[2];
      knob.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('13');

    // Test a fader (CC 5) - faders are rectangles
    await page.evaluate(() => {
      const rects = document.querySelectorAll('svg rect');
      for (const rect of rects) {
        if (rect.getAttribute('x') === '145' &&
            rect.getAttribute('width') === '30' &&
            rect.getAttribute('height') === '20') {
          rect.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        }
      }
    });
    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('5');

    // Test a button (CC 37)
    await page.evaluate(() => {
      const rects = document.querySelectorAll('svg rect');
      for (const rect of rects) {
        if (rect.getAttribute('x') === '135' &&
            rect.getAttribute('y') === '510' &&
            rect.getAttribute('width') === '50') {
          rect.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        }
      }
    });
    await expect(page.getByRole('spinbutton', { name: 'CC Number' })).toHaveValue('37');
  });
});