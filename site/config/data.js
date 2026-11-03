/**
 * Global template data for the vb-design-system mini-site.
 */
export default {
  site: {
    title: 'VB Design System',
    description: 'Design-system documentation components for Vanilla Breeze.',
    repo: 'https://github.com/ProfPowell/vb-design-system',
    vbDocs: 'https://vanilla-breeze.com/docs/',
    packCss: 'vb-design-system.css',
    packJs: 'vb-design-system.js',
    // Pages subpath for inline scripts and data-* attributes, which cook's
    // basePath pass (HTML href/src only) does not rewrite. Empty under
    // `cook dev` (NODE_ENV=development) so the site still runs at '/'.
    basePath: process.env.NODE_ENV === 'development' ? '' : '/vb-design-system',
  },
  defaultTheme: 'modern',
};
