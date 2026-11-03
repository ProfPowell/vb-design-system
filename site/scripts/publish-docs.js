/**
 * Publish the built site into <repo>/docs for GitHub Pages (deploy-from-branch).
 *
 * Cook owns the HTML side of sub-path hosting (config/main.js): `basePath`
 * prefixes root-relative href/src/srcset/url() in production builds, `<html data-base-path>`
 * (from `${site.basePath}` in config/data.js; cook does not interpolate inline
 * script text) feeds inline scripts, and `sitemap` writes sitemap.xml.
 * (cook `fingerprint` is off until it honours siteRoot.)
 *
 * What is left for this script:
 *  - copy dist/pages -> docs and add .nojekyll
 *  - prefix the few root-absolute paths that live inside JS (cook leaves JS alone)
 *  - stamp ?v= on local CSS/JS refs (cache-busting)
 *  - build the Pagefind search index over the final output
 *
 * Usage: node scripts/publish-docs.js /<repo>     (e.g. /vb-design-system)
 *        BASE_PATH=/<repo> node scripts/publish-docs.js
 */
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = resolve(siteRoot, '..');
const BASE = (process.argv[2] || process.env.BASE_PATH || '').replace(/\/$/, '');

const from = resolve(siteRoot, 'dist/pages');
const to = resolve(repoRoot, 'docs');
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
writeFileSync(join(to, '.nojekyll'), '');

// Root-absolute paths inside JS. The VB bundle reads window.__VB_THEME_BASE and
// <html data-icon-path> (set by the layouts) for themes and icons, but still
// hardcodes the theme manifest, DTCG links and sw.js under /cdn/, and
// site-search dynamically imports '/pagefind/pagefind.js' and needs a baseUrl
// so result links resolve under the subpath. icon-wc builds its path from
// "/cdn/icons" (no trailing slash), so prefix any "/cdn/". (jsdelivr/cartocdn
// use "cdn." not "/cdn/", so they are unaffected.)
function patchJs(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { patchJs(p); continue; }
    if (extname(p) !== '.js') continue;
    let js = readFileSync(p, 'utf8');
    let changed = false;
    if (js.includes('/cdn/')) { js = js.replaceAll('/cdn/', BASE + '/cdn/'); changed = true; }
    if (js.includes('/pagefind/')) { js = js.replaceAll('/pagefind/', BASE + '/pagefind/'); changed = true; }
    if (js.includes('excerptLength:20')) { js = js.replaceAll('excerptLength:20', `excerptLength:20,baseUrl:"${BASE}"`); changed = true; }
    if (changed) writeFileSync(p, js);
  }
}
if (BASE) patchJs(to);

// Cache-bust local CSS/JS references. Stand-in for cook fingerprinting (see
// config/main.js): GitHub Pages serves with max-age=600, so without a changing
// URL a redeployed bundle can be served stale.
const STAMP = Date.now().toString(36);
function stampHtml(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { stampHtml(p); continue; }
    if (extname(p) !== '.html') continue;
    const html = readFileSync(p, 'utf8').replace(/(href|src)="([^"]+\.(?:js|css))(\?[^"]*)?"/g, (m, attr, url, q) =>
      /^https?:/.test(url) ? m : `${attr}="${url}${q ? q + '&' : '?'}v=${STAMP}"`);
    writeFileSync(p, html);
  }
}
stampHtml(to);
console.log(`Published ${from} -> ${to}${BASE ? ` (base ${BASE}, JS paths prefixed)` : ' (no base prefix)'}`);

// Build the Pagefind search index over the published output (powers <site-search>).
try {
  const localBin = resolve(siteRoot, 'node_modules/.bin/pagefind');
  const cmd = existsSync(localBin) ? localBin : 'npx';
  const cmdArgs = existsSync(localBin) ? ['--site', to] : ['--yes', 'pagefind', '--site', to];
  execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: repoRoot });
  console.log('Pagefind index built -> docs/pagefind/');
} catch (e) {
  console.warn('Pagefind indexing failed (search will degrade gracefully):', e.message);
}
