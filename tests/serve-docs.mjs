// Minimal static file server for the built docs/ site, mounted under the
// /vb-design-system/ path prefix so the absolute URLs baked into the built
// HTML (e.g. href="/vb-design-system/main.css") resolve correctly when
// running component tests locally against the GitHub-Pages-shaped build.
//
// Node built-ins only — no dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 4330;
const MOUNT = '/vb-design-system';

const here = fileURLToPath(new URL('.', import.meta.url));
const docsRoot = resolve(here, '..', 'docs');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function contentTypeFor(path) {
  return CONTENT_TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith(MOUNT)) {
      pathname = pathname.slice(MOUNT.length);
    }
    if (pathname === '' || pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    // Prevent path traversal outside docsRoot.
    const filePath = normalize(join(docsRoot, pathname));
    if (!filePath.startsWith(docsRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const st = await stat(filePath).catch(() => null);
    if (!st || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Internal error: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${docsRoot} at http://${HOST}:${PORT}${MOUNT}/`);
});
