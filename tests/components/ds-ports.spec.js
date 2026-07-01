import { test, expect } from '@playwright/test';

test('palette-generator registers and renders', async ({ page }) => {
  await page.goto('elements/palette-generator/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('palette-generator'))).toBe(true);
  await expect(page.locator('palette-generator').first()).toBeVisible();
});

test('semantic-palette still renders after palette-generator port', async ({ page }) => {
  await page.goto('elements/semantic-palette/');
  await expect(page.locator('semantic-palette').first()).toBeVisible();
});

test('accessibility-specimen registers and renders', async ({ page }) => {
  await page.goto('elements/accessibility-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('accessibility-specimen'))).toBe(true);
  await expect(page.locator('accessibility-specimen').first()).toBeVisible();
});

test('breakpoint-specimen registers and renders', async ({ page }) => {
  await page.goto('elements/breakpoint-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('breakpoint-specimen'))).toBe(true);
  await expect(page.locator('breakpoint-specimen').first()).toBeVisible();
});

test('layout-specimen registers and renders', async ({ page }) => {
  await page.goto('elements/layout-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('layout-specimen'))).toBe(true);
  await expect(page.locator('layout-specimen').first()).toBeVisible();
});

test('font-pairer registers and renders', async ({ page }) => {
  await page.goto('elements/font-pairer/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('font-pairer'))).toBe(true);
  await expect(page.locator('font-pairer').first()).toBeVisible();
  await expect(page.locator('font-pairer button, font-pairer select').first()).toBeVisible();
});
