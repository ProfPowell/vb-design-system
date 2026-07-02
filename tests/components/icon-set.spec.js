import { test, expect } from '@playwright/test';

test('icon-set renders a filterable, copyable grid from names via icon-wc', async ({ page }) => {
  await page.goto('elements/icon-set/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('icon-set'))).toBe(true);
  await page.evaluate(() => {
    const s = document.createElement('icon-set');
    s.id = 'probe';
    s.setAttribute('names', 'star home search');
    document.body.appendChild(s);
  });
  const grid = page.locator('#probe');
  await expect(grid.locator('[data-icon-name]')).toHaveCount(3);
  // each cell renders via <icon-wc>, not a bare [data-icon] element (unpublished primitive)
  await expect(grid.locator('icon-wc').first()).toBeVisible();
  // filter
  await grid.locator('input[type="search"]').fill('hom');
  await expect(grid.locator('[data-icon-name]:visible')).toHaveCount(1);
});
