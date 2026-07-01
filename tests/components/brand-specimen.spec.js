import { test, expect } from '@playwright/test';

test('brand-specimen renders the mark on light and dark panels + a size scale', async ({ page }) => {
  await page.goto('elements/brand-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('brand-specimen'))).toBe(true);
  const el = page.locator('brand-specimen').first();
  await expect(el).toBeVisible();
  // one mark per surface panel (light + dark) + one per size in the scale
  await expect(el.locator('[data-surface="light"] brand-mark')).toHaveCount(1);
  await expect(el.locator('[data-surface="dark"] brand-mark')).toHaveCount(1);
  await expect(el.locator('[data-scale] brand-mark')).toHaveCount(4); // default s m l xl
});
