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

test('gradient-builder registers and renders', async ({ page }) => {
  await page.goto('elements/gradient-builder/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('gradient-builder'))).toBe(true);
  await expect(page.locator('gradient-builder').first()).toBeVisible();
});

test('theme-import registers and renders', async ({ page }) => {
  await page.goto('elements/theme-import/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('theme-import'))).toBe(true);
  await expect(page.locator('theme-import').first()).toBeVisible();
});

test('theme-catalog registers and loads catalog entries', async ({ page }) => {
  await page.goto('elements/theme-catalog/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('theme-catalog'))).toBe(true);
  const cat = page.locator('theme-catalog').first();
  await expect(cat).toBeVisible();
  // catalog tiles load from /cdn/themes/catalog/manifest.json — assert at least one entry rendered
  await expect(cat.locator('article[data-id], button.tc-apply').first()).toBeVisible({ timeout: 10000 });
});
