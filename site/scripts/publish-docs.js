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

// Prefix root-absolute href/src (not protocol-relative //, not external http(s))
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (extname(p) !== '.html') continue;
    let html = readFileSync(p, 'utf8');
    if (BASE) {
      html = html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
    }
    writeFileSync(p, html);
  }
}
// theme-picker hardcodes /cdn/themes/ — prefix it for the project subpath
if (BASE) {
  const tp = join(to, 'assets/vendor/vb-theme-picker.js');
  if (existsSync(tp)) writeFileSync(tp, readFileSync(tp,'utf8').replaceAll('/cdn/themes/', BASE + '/cdn/themes/'));
  const iw = join(to, 'assets/vendor/icon-wc.js');
  if (existsSync(iw)) writeFileSync(iw, readFileSync(iw,'utf8').replaceAll('/cdn/icons/', BASE + '/cdn/icons/'));
}
walk(to);
console.log(`Published ${from} -> ${to}${BASE ? ` (base ${BASE})` : ' (no base prefix)'}`);
