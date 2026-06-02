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
    if (!BASE) continue;
    if (ext === '.html') {
      writeFileSync(p, readFileSync(p, 'utf8').replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`));
    } else if (ext === '.js') {
      let js = readFileSync(p, 'utf8');
      if (js.includes('/cdn/')) {
        js = js.replaceAll('/cdn/', BASE + '/cdn/');
        writeFileSync(p, js);
      }
    }
  }
}
walk(to);
console.log(`Published ${from} -> ${to}${BASE ? ` (base ${BASE})` : ' (no base prefix)'}`);
