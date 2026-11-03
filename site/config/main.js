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
  // Content-hash fingerprinting is OFF: cook 2.4.0's fingerprint plugin keys its
  // manifest from distPath (/pages/assets/x.css) but HTML refs are siteRoot-
  // relative (/assets/x.css), so it renames files and rewrites 0 references,
  // breaking every page. Re-enable (excludePaths ['/cdn/', '/pagefind/'] — those
  // are fetched by computed URL at runtime) once the plugin honours siteRoot.
  // Until then publish-docs.js stamps ?v= on local CSS/JS refs.
  fingerprint: { enabled: false },
  buildOnlyPaths: ['layouts', 'includes'],
  plugins: {
    before: [],
    default: ['generate-api-tables'],
    after: [],
  },
  pluginPath: 'plugins',
  images: { enabled: false },
  formats: { markdown: false, json: false, feed: null, llmsTxt: false },
  fragments: { enabled: false },
};
