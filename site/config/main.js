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
