/**
 * Cook build config for the vb-design-system documentation mini-site.
 */
export default {
  srcPath: 'src',
  distPath: 'dist',
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
