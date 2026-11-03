import { test, expect } from '@playwright/test';

test('component-sampler renders only the requested native controls', async ({ page }) => {
  await page.goto('elements/component-sampler/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('component-sampler'))).toBe(true);
  // the doc page's live demo renders the full default set
  await expect(page.locator('.example component-sampler button').first()).toBeVisible();
  await page.evaluate(() => {
    const el = document.createElement('component-sampler');
    el.id = 'probe';
    el.setAttribute('components', 'button,select');
    document.body.appendChild(el);
  });
  const el = page.locator('#probe');
  await expect(el.locator('button').first()).toBeVisible();
  await expect(el.locator('button:disabled')).toHaveCount(1);
  await expect(el.locator('select')).toHaveCount(1);
  // not requested, so not rendered
  await expect(el.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(el.locator('progress')).toHaveCount(0);
});
