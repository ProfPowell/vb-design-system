import { test, expect } from '@playwright/test';

test('theme-export serializes the scope\'s inline tokens as CSS, JSON and DTCG', async ({ page }) => {
  await page.goto('elements/theme-export/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('theme-export'))).toBe(true);
  await expect(page.locator('theme-export').first()).toBeVisible();
  await page.evaluate(() => {
    // theme-export reads tokens set on the scope element itself (what the
    // editable specimens / theme composer write), not stylesheet defaults
    document.documentElement.style.setProperty('--color-primary', 'oklch(55% 0.2 260)');
    document.documentElement.style.setProperty('--color-accent', '#ff6600');
    document.documentElement.style.setProperty('--size-m', '1rem');
    const el = document.createElement('theme-export');
    el.id = 'probe';
    el.setAttribute('include', '--color-');
    document.body.appendChild(el);
  });
  const el = page.locator('#probe');
  const out = el.locator('.te-output');
  await expect.poll(() => out.inputValue()).toContain('--color-accent: #ff6600');
  const css = await out.inputValue();
  expect(css).toMatch(/^:root\s*\{/);
  expect(css).not.toContain('--size-m'); // filtered by `include`
  await el.locator('.te-format').selectOption('json');
  await expect.poll(async () => { try { return JSON.parse(await out.inputValue())['--color-primary']; } catch { return null; } }).toBe('oklch(55% 0.2 260)');
  await el.locator('.te-format').selectOption('dtcg');
  await expect.poll(async () => { try { return JSON.stringify(JSON.parse(await out.inputValue())).includes('"$value"'); } catch { return false; } }).toBe(true);
});
