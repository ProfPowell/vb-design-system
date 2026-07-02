import { test, expect } from '@playwright/test';

test('icon-specimen shows each icon across the size scale via [data-icon]', async ({ page }) => {
  await page.goto('elements/icon-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('icon-specimen'))).toBe(true);
  await page.evaluate(() => {
    const s = document.createElement('icon-specimen');
    s.id = 'probe';
    s.setAttribute('names', 'check x');
    s.setAttribute('data-sizes', '1rem 2rem');
    document.body.appendChild(s);
  });
  const specimen = page.locator('#probe');
  // 2 icons x 2 sizes = 4 rendered [data-icon] cells
  await expect(specimen.locator('i[data-icon]')).toHaveCount(4);
  // the VB enhancer resolves each icon to its SVG (proves [data-icon] renders,
  // not just that the element exists)
  await expect
    .poll(() => specimen.locator('i[data-icon]').first().evaluate((el) => el.style.getPropertyValue('--vb-icon')))
    .toContain('.svg');
  // sizes actually differ in the rendered output ([data-icon] is sized in em)
  const fontSizes = await specimen.locator('i[data-icon]').evaluateAll(
    (els) => els.map((el) => getComputedStyle(el).fontSize)
  );
  expect(new Set(fontSizes).size).toBeGreaterThan(1);
});
