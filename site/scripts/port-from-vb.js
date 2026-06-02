/**
 * One-time port: bring the authored element doc pages + demos for this pack
 * out of the vanilla-breeze repo into this mini-site, rewriting asset paths.
 * Re-runnable (idempotent overwrite). Requires the vanilla-breeze checkout as a
 * sibling: ../../vanilla-breeze relative to the package repo.
 */
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = resolve(siteRoot, '..');
const VB = resolve(repoRoot, '../vanilla-breeze');           // sibling checkout
const PACK_JS = 'vb-design-system.js', PACK_CSS = 'vb-design-system.css';

const COMPONENTS = ['color-palette','type-specimen','spacing-specimen','token-specimen','component-sampler','semantic-palette','motion-specimen','theme-export'];

if (!existsSync(VB)) { console.error(`! vanilla-breeze checkout not found at ${VB}`); process.exit(1); }

const ensure = (p) => mkdirSync(p, { recursive: true });
ensure(resolve(siteRoot, 'plugins'));
ensure(resolve(siteRoot, 'data'));
ensure(resolve(siteRoot, 'src/pages/elements'));
ensure(resolve(siteRoot, 'src/pages/demos'));

// 1. api-tables plugin + apiRegistry data (the plugin imports ../data/apiRegistry.js)
copyFileSync(resolve(VB, 'site/plugins/generate-api-tables.js'), resolve(siteRoot, 'plugins/generate-api-tables.js'));
copyFileSync(resolve(VB, 'site/src/_data/apiRegistry.js'), resolve(siteRoot, 'data/apiRegistry.js'));
console.log('✓ plugin + apiRegistry');

// 2. element pages — rewrite demo src paths
const DOCS = resolve(VB, 'site/src/pages/docs/elements/web-components');
const referencedDemos = new Set();
for (const c of COMPONENTS) {
  const srcFile = resolve(DOCS, `${c}.html`);
  if (!existsSync(srcFile)) { console.warn(`  ! no doc page for ${c}`); continue; }
  let html = readFileSync(srcFile, 'utf8');
  // collect referenced demos, then point them at /demos/
  for (const m of html.matchAll(/\/docs\/examples\/demos\/([^"']+)/g)) referencedDemos.add(m[1]);
  html = html.replace(/\/docs\/examples\/demos\//g, '/demos/');
  writeFileSync(resolve(siteRoot, `src/pages/elements/${c}.html`), html);
}
console.log(`✓ ${COMPONENTS.length} element pages (referenced demos: ${referencedDemos.size})`);

// 3. demos — copy + rewrite asset refs to mini-site assets
const DEMOS = resolve(VB, 'demos/examples/demos');
let copied = 0, missing = [];
for (const rel of referencedDemos) {
  const from = resolve(DEMOS, rel);
  if (!existsSync(from)) { missing.push(rel); continue; }
  let html = readFileSync(from, 'utf8');
  html = html
    .replace(/\/src\/main\.css/g, '/assets/vendor/vanilla-breeze.css')
    .replace(/\/src\/main\.js/g, `/assets/pack/${PACK_JS}`);
  // ensure pack component CSS is present (inject after the VB css link, once)
  if (!html.includes(`/assets/pack/${PACK_CSS}`)) {
    html = html.replace(
      '/assets/vendor/vanilla-breeze.css" />',
      `/assets/vendor/vanilla-breeze.css" />\n  <link rel="stylesheet" href="/assets/pack/${PACK_CSS}" />`
    ).replace(
      '/assets/vendor/vanilla-breeze.css">',
      `/assets/vendor/vanilla-breeze.css">\n  <link rel="stylesheet" href="/assets/pack/${PACK_CSS}">`
    );
  }
  const outDir = resolve(siteRoot, 'src/pages/demos', dirname(rel));
  ensure(outDir);
  writeFileSync(resolve(siteRoot, 'src/pages/demos', rel), html);
  copied++;
}
console.log(`✓ demos copied: ${copied}${missing.length ? ` — missing (skipped): ${missing.join(', ')}` : ''}`);
console.log('Port complete.');
