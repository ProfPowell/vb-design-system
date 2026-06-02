/**
 * Publish the built site into <repo>/docs for GitHub Pages (deploy-from-branch).
 * Project Pages serve at https://<user>.github.io/<repo>/ — a subpath — so
 * root-absolute URLs in the HTML are prefixed with the base path.
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
// Per-publish cache-buster. theme-picker hardcodes /cdn/themes/ (no configurable
// base), so its path is patched in the JS at publish time; without a changing URL
// browsers serve a stale cached copy (cache-control: max-age=600) and fetch the
// old, unprefixed path. Stamping local asset URLs forces a fresh fetch each deploy.
const STAMP = Date.now().toString(36);

const from = resolve(siteRoot, 'dist/pages');
const to = resolve(repoRoot, 'docs');
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
writeFileSync(join(to, '.nojekyll'), '');

// Under a project subpath, prefix root-absolute URLs:
//  - HTML: every href/src (not protocol-relative // or external http(s))
//  - JS: runtime fetches of /cdn/* (themes, icons, packs, sw) by theme-picker,
//        icon-wc, the full VB bundle, and the alpenglow switcher. icon-wc builds
//        its path from "/cdn/icons" (no trailing slash), so prefix any "/cdn/".
//        (jsdelivr/cartocdn use "cdn." not "/cdn/", so they're unaffected.)
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const ext = extname(p);
    if (ext === '.html') {
      let html = readFileSync(p, 'utf8').replaceAll('%BASE_PATH%', BASE);   // '' for local root
      if (BASE) html = html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
      // cache-bust local js/css so a changed build is never served stale
      html = html.replace(/(href|src)="([^"]+\.(?:js|css))(\?[^"]*)?"/g, (m, attr, url, q) =>
        /^https?:/.test(url) ? m : `${attr}="${url}${q ? q + '&' : '?'}v=${STAMP}"`);
      writeFileSync(p, html);
    } else if (BASE && ext === '.js') {
      let js = readFileSync(p, 'utf8');
      let changed = false;
      if (js.includes('/cdn/')) { js = js.replaceAll('/cdn/', BASE + '/cdn/'); changed = true; }
      // site-search dynamically imports '/pagefind/pagefind.js' (root-absolute) and
      // calls pagefind.options({excerptLength:20}). Under the Pages subpath the import
      // 404s and result URLs lack the base — prefix the import and inject baseUrl so
      // both the bundle load and result navigation resolve correctly.
      if (js.includes('/pagefind/')) { js = js.replaceAll('/pagefind/', BASE + '/pagefind/'); changed = true; }
      if (js.includes('excerptLength:20')) { js = js.replaceAll('excerptLength:20', `excerptLength:20,baseUrl:"${BASE}"`); changed = true; }
      if (changed) writeFileSync(p, js);
    }
  }
}
walk(to);
console.log(`Published ${from} -> ${to}${BASE ? ` (base ${BASE})` : ' (no base prefix)'}`);

// Build the Pagefind search index over the published output (powers <site-search>).
// Runs AFTER the URL rewrites so indexed page URLs match what the browser requests.
try {
  const localBin = resolve(siteRoot, 'node_modules/.bin/pagefind');
  const cmd = existsSync(localBin) ? localBin : 'npx';
  const cmdArgs = existsSync(localBin) ? ['--site', to] : ['--yes', 'pagefind', '--site', to];
  execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: repoRoot });
  console.log('Pagefind index built -> docs/pagefind/');
} catch (e) {
  console.warn('Pagefind indexing failed (search will degrade gracefully):', e.message);
}
