/**
 * Cook build config for the vb-design-system documentation mini-site.
 */
export default {
  srcPath: 'src',
  distPath: 'dist',
  // Pages live in src/pages and deploy from dist/pages; without this cook
  // resolves the current page as /pages/... and no nav href matches, so no
  // link gets class="active" / aria-current (cook >= 2.2.2).
  siteRoot: 'pages',
  // GitHub Pages project site: https://profpowell.github.io/vb-design-system/
  // Production builds prefix root-relative URLs in HTML (cook dev stays at '/').
  // Inline scripts / data-* attributes use ${site.basePath} from data.js instead.
  basePath: '/vb-design-system',
  sitemap: { url: 'https://profpowell.github.io/vb-design-system' },
  // Content-hash CSS/JS and rewrite <link href> / <script src> (cook >= 2.5.0
  // keys the manifest from siteRoot). cdn/ (themes, icons, catalog) is fetched
  // by URLs computed at runtime and pagefind/ is built after cook, so both
  // keep their plain names.
  fingerprint: { enabled: true, excludePaths: ['/cdn/', '/pagefind/'] },
  // HTML pages with front matter join collections by first folder
  // (collections.elements, .guides, .tools, ...). plugins/element-groups.js
  // turns collections.elements into the grouped lists the index and home
  // page repeat over.
  collections: { html: true },
  buildOnlyPaths: ['layouts', 'includes'],
  plugins: {
    before: ['element-groups'],
    default: ['generate-api-tables'],
    after: [],
  },
  pluginPath: 'plugins',
  images: { enabled: false },
  formats: { markdown: false, json: false, feed: null, llmsTxt: false },
  fragments: { enabled: false },
};
