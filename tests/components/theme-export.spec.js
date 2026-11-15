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

test('DTCG export writes computed values, never stand-ins', async ({ page }) => {
  await page.goto('elements/theme-export/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('theme-export'))).toBe(true);
  await page.evaluate(() => {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', 'oklch(55% 0.2 260)');
    root.setProperty('--color-primary-hover', 'oklch(from var(--color-primary) calc(l - 0.08) c h)');
    root.setProperty('--color-interactive', 'var(--color-primary)');
    root.setProperty('--letter-spacing-tight', '-0.02em');
    root.setProperty('--ease-steps', 'steps(4)');
    const el = document.createElement('theme-export');
    el.id = 'probe2';
    el.setAttribute('format', 'dtcg');
    document.body.appendChild(el);
  });
  const out = page.locator('#probe2 .te-output');
  await expect.poll(async () => { try { return !!JSON.parse(await out.inputValue()).color; } catch { return false; } }).toBe(true);
  const text = await out.inputValue();
  const doc = JSON.parse(text);
  const ext = doc.$extensions['com.vanilla-breeze'];
  // A relative color is computed (lightness 0.55 - 0.08), with the CSS kept for re-import.
  const hover = JSON.stringify(doc).match(/\{[^{}]*"components":\[0\.47[^\]]*\][^{}]*\}/);
  expect(hover, 'computed hover color').not.toBeNull();
  expect(text).toContain('oklch(from var(--color-primary) calc(l - 0.08) c h)');
  // A lone reference is an alias; em is a number with a unit; steps() has no DTCG form.
  expect(text).toMatch(/"\$value":\s*"\{color\.[\w.]*primary\}"/);
  expect(text).toMatch(/"unit":\s*"em"/);
  expect(ext.cssOnly['--ease-steps']).toBe('steps(4)');
});
