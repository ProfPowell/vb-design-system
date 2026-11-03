import { test, expect } from '@playwright/test';

test('motion-specimen lists easing and duration tokens with their values', async ({ page }) => {
  await page.goto('elements/motion-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('motion-specimen'))).toBe(true);
  await expect(page.locator('motion-specimen').first()).toBeVisible();
  await page.evaluate(() => {
    const ease = document.createElement('motion-specimen');
    ease.id = 'probe-ease';
    ease.setAttribute('tokens', '1,2,out-3');
    document.body.appendChild(ease);
    const dur = document.createElement('motion-specimen');
    dur.id = 'probe-dur';
    dur.setAttribute('type', 'duration');
    document.body.appendChild(dur);
  });
  const ease = page.locator('#probe-ease');
  await expect(ease.locator('.ms-row')).toHaveCount(3);
  await expect(ease.locator('[data-var="--ease-out-3"]')).toHaveCount(1);
  // default duration list: instant fast normal slow slower
  await expect(page.locator('#probe-dur .ms-row')).toHaveCount(5);
  await expect(page.locator('#probe-dur [data-var="--duration-normal"]')).toHaveCount(1);
  // show-values defaults on: the resolved token value is shown, not an empty cell
  await expect(ease.locator('.ms-value').first()).not.toBeEmpty();
});
