import { test, expect } from '@playwright/test';

test('icon-specimen shows each icon across the size scale via icon-wc', async ({ page }) => {
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
  // 2 icons x 2 sizes = 4 rendered icon-wc cells (not [data-icon] — unpublished primitive)
  await expect(specimen.locator('icon-wc')).toHaveCount(4);
  // at least one icon actually renders (proves icon-wc upgraded and displays)
  await expect(specimen.locator('icon-wc').first()).toBeVisible();
  // sizes actually differ in the rendered output
  const fontSizes = await specimen.locator('icon-wc').evaluateAll(
    (els) => els.map((el) => getComputedStyle(el).fontSize)
  );
  expect(new Set(fontSizes).size).toBeGreaterThan(1);
});
