import { test, expect } from '@playwright/test';

test('spacing-specimen renders a bar per token sized from the live token', async ({ page }) => {
  await page.goto('elements/spacing-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('spacing-specimen'))).toBe(true);
  const first = page.locator('spacing-specimen').first();
  await expect(first).toBeVisible();
  // default scale: 3xs … 3xl
  await expect(first.locator('.scale-bar')).toHaveCount(9);
  await page.evaluate(() => {
    const el = document.createElement('spacing-specimen');
    el.id = 'probe';
    el.setAttribute('tokens', 's,m,l');
    el.setAttribute('editable', '');
    document.body.appendChild(el);
  });
  const el = page.locator('#probe');
  await expect(el.locator('.scale-bar')).toHaveCount(3);
  await expect(el.locator('input[data-token]')).toHaveCount(3);
  // bars grow with the scale
  const widths = await el.locator('.scale-bar').evaluateAll((bars) => bars.map((b) => b.getBoundingClientRect().width));
  expect(widths[0]).toBeGreaterThan(0);
  expect(widths[1]).toBeGreaterThan(widths[0]);
  expect(widths[2]).toBeGreaterThan(widths[1]);
});
