/**
 * Copy build-time assets into src/assets/ so Cook copies them to dist:
 *   - Vanilla Breeze tokens/themes CSS (devDependency) — styling + theme picker
 *   - the pack's own dist bundle (../dist) — the components this site documents
 *   - companion components used by the docs (browser-window, code-block)
 */
import { mkdirSync, copyFileSync, existsSync, readFileSync, cpSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = resolve(siteRoot, '..');
const nm = resolve(siteRoot, 'node_modules');
const vendor = resolve(siteRoot, 'src/pages/assets/vendor');
const packDir = resolve(siteRoot, 'src/pages/assets/pack');
mkdirSync(vendor, { recursive: true });
mkdirSync(packDir, { recursive: true });

const cp = (from, to) => {
  if (!existsSync(from)) { console.warn(`  ! missing: ${from}`); return false; }
  copyFileSync(from, to);
  console.log(`  ✓ ${to.replace(siteRoot + '/', '')}`);
  return true;
};

// Resolve a package's main module file via its package.json
function pkgMain(pkg) {
  const pj = JSON.parse(readFileSync(resolve(nm, pkg, 'package.json'), 'utf8'));
  const m = pj.module || pj.main || (pj.exports && (pj.exports['.']?.import || pj.exports['.']?.default || pj.exports['.']));
  return resolve(nm, pkg, m);
}

console.log('Copying Vanilla Breeze assets…');
cp(resolve(nm, 'vanilla-breeze/dist/cdn/vanilla-breeze.css'), resolve(vendor, 'vanilla-breeze.css'));
// Full VB bundle for the alpenglow brand-replication demo (does not load the pack, so no conflict)
cp(resolve(nm, 'vanilla-breeze/dist/cdn/vanilla-breeze.js'), resolve(vendor, 'vanilla-breeze.js'));
// Real VB theme picker (standalone, conflict-free — defines only <theme-picker>)
cp(resolve(nm, 'vanilla-breeze/dist/cdn/components/theme-picker.js'), resolve(vendor, 'vb-theme-picker.js'));

console.log('Copying VB themes catalog (for the full theme picker)…');
const themesFrom = resolve(nm, 'vanilla-breeze/dist/cdn/themes');
const themesTo = resolve(siteRoot, 'src/pages/cdn/themes');
mkdirSync(themesTo, { recursive: true });
cpSync(themesFrom, themesTo, { recursive: true });
console.log('  ✓ src/pages/cdn/themes (' + readdirSync(themesTo).length + ' files)');

// Core elements the Meridian showcase uses (standalone, conflict-free)
cp(resolve(nm, 'vanilla-breeze/dist/cdn/components/brand-mark.js'), resolve(vendor, 'brand-mark.js'));
cp(resolve(nm, 'vanilla-breeze/dist/cdn/components/icon-wc.js'), resolve(vendor, 'icon-wc.js'));
// Extra components used by guides/theme-composer but not in the main bundle
cp(resolve(nm, 'vanilla-breeze/dist/cdn/components/color-picker.js'), resolve(vendor, 'color-picker.js'));
// design-system CSS patterns (do-dont, token-table) shipped by the package
mkdirSync(resolve(vendor, 'patterns'), { recursive: true });
cp(resolve(repoRoot, 'src/patterns/do-dont.css'), resolve(vendor, 'patterns/do-dont.css'));
cp(resolve(repoRoot, 'src/patterns/token-table.css'), resolve(vendor, 'patterns/token-table.css'));
// Full icon catalog (icon-wc fetches /cdn/icons/<set>/<name>.svg on demand)
const iconsDest = resolve(siteRoot, 'src/pages/cdn/icons');
mkdirSync(iconsDest, { recursive: true });
cpSync(resolve(nm, 'vanilla-breeze/dist/cdn/icons'), iconsDest, { recursive: true });
console.log('  ✓ src/pages/cdn/icons (' + readdirSync(iconsDest).length + ' sets)');
// Emit a <set>.json name manifest per icon set so <icon-set set="…"> (no `names`)
// can fetch and render the full set. Regenerated every prebuild from the copied
// SVGs, so it stays in sync with whatever vanilla-breeze ships.
for (const set of readdirSync(iconsDest, { withFileTypes: true })) {
  if (!set.isDirectory()) continue;
  const names = readdirSync(resolve(iconsDest, set.name))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -4))
    .sort();
  if (names.length) writeFileSync(resolve(iconsDest, set.name + '.json'), JSON.stringify(names));
}
console.log('  ✓ icon set manifests (<set>.json)');

console.log('Copying pack bundle…');
cp(resolve(repoRoot, 'dist/vb-design-system.js'), resolve(packDir, 'vb-design-system.js'));
cp(resolve(repoRoot, 'dist/vb-design-system.css'), resolve(packDir, 'vb-design-system.css'));

console.log('Copying companion components (demos + source display)…');
try { cp(pkgMain('@profpowell/browser-window'), resolve(vendor, 'browser-window.js')); } catch (e) { console.warn('  ! browser-window:', e.message); }
try { cp(pkgMain('@profpowell/code-block'), resolve(vendor, 'code-block.js')); } catch (e) { console.warn('  ! code-block:', e.message); }

console.log('Assets copied.');
