import { test, expect } from '@playwright/test';

test('token-specimen renders a sample per token for each type', async ({ page }) => {
  await page.goto('elements/token-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('token-specimen'))).toBe(true);
  await expect(page.locator('token-specimen').first()).toBeVisible();
  await page.evaluate(() => {
    for (const type of ['color', 'radius', 'border']) {
      const el = document.createElement('token-specimen');
      el.id = `probe-${type}`;
      el.setAttribute('type', type);
      document.body.appendChild(el);
    }
  });
  await expect(page.locator('#probe-color [data-token-sample]')).toHaveCount(7); // primary … info
  await expect(page.locator('#probe-radius [data-token-sample]')).toHaveCount(7); // xs … full
  await expect(page.locator('#probe-border [data-token-sample]')).toHaveCount(3); // thin medium thick
  // the sample actually resolves the token (a theme is loaded on the docs page)
  const bg = await page.locator('#probe-color [data-token-sample="primary"]').evaluate((n) => getComputedStyle(n).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('#probe-color [data-token-value]').first()).not.toBeEmpty();
});
