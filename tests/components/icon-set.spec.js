import { test, expect } from '@playwright/test';

test('icon-set renders a filterable, copyable grid from names via [data-icon]', async ({ page }) => {
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
  // Icons lazy-mount when a cell nears the viewport (avoids a fetch storm on
  // large sets). Scroll the grid in so the IntersectionObserver mounts them.
  await grid.scrollIntoViewIfNeeded();
  // each cell renders the icon via the [data-icon] primitive; the VB enhancer
  // resolves it to its SVG (proves it actually renders, not just mounts)
  await expect
    .poll(() => grid.evaluate((el) => {
      const i = el.querySelector('i[data-icon]');
      return i ? i.style.getPropertyValue('--vb-icon') : '';
    }))
    .toContain('.svg');
  // filter
  await grid.locator('input[type="search"]').fill('hom');
  await expect(grid.locator('[data-icon-name]:visible')).toHaveCount(1);
});
