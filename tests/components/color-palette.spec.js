import { test, expect } from '@playwright/test';

test('color-palette renders one swatch per color, shows names, and emits select', async ({ page }) => {
  await page.goto('elements/color-palette/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('color-palette'))).toBe(true);
  await page.evaluate(() => {
    const el = document.createElement('color-palette');
    el.id = 'probe';
    el.setAttribute('colors', '#ff0000, #00ff00, #0000ff');
    el.setAttribute('names', 'Red, Green, Blue');
    el.setAttribute('show-names', '');
    document.body.appendChild(el);
    window.__selected = null;
    el.addEventListener('color-palette:select', (e) => { window.__selected = e.detail; });
  });
  const el = page.locator('#probe');
  await expect(el.locator('.color-box')).toHaveCount(3);
  await expect(el).toContainText('Green');
  await el.locator('[data-index="1"]').first().click();
  await expect.poll(() => page.evaluate(() => window.__selected)).toMatchObject({ index: 1, name: 'Green' });
});
