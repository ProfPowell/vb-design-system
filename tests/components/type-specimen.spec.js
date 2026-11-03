import { test, expect } from '@playwright/test';

test('type-specimen renders the s/m/l scale, weights and character rows', async ({ page }) => {
  await page.goto('elements/type-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('type-specimen'))).toBe(true);
  await expect(page.locator('type-specimen').first()).toBeVisible();
  await page.evaluate(() => {
    const el = document.createElement('type-specimen');
    el.id = 'probe';
    el.setAttribute('font-family', 'Georgia, serif');
    el.setAttribute('weights', '400,700');
    el.setAttribute('show-scale', '');
    el.setAttribute('show-weights', '');
    el.setAttribute('show-characters', '');
    document.body.appendChild(el);
  });
  const el = page.locator('#probe');
  const labels = await el.locator('.specimen-scale .scale-label').allTextContents();
  expect(labels).toEqual(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl']); // VB 0.4 spelling, not sm/md/lg
  await expect(el.locator('.weight-sample')).toHaveCount(2);
  await expect(el.locator('.char-row')).toHaveCount(4);
  const ff = await el.locator('.specimen-sample').first().evaluate((n) => getComputedStyle(n).fontFamily);
  expect(ff).toContain('Georgia');
});
