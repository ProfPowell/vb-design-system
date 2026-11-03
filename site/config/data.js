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

  // Role groups for the 19 elements. Each src/pages/elements/<name>.html
  // declares `group: <id>` (and an optional `order`) in its front matter;
  // plugins/element-groups.js fills `items` from the cook HTML collection and
  // the elements index + home page repeat over these.
  elementGroups: [
    {
      id: 'specimens',
      title: 'Specimens &amp; samplers',
      blurb: 'Show the system as it is: type, spacing, tokens, motion, layout primitives, breakpoints, and native UI in the active theme.',
    },
    {
      id: 'color',
      title: 'Color &amp; palette',
      blurb: 'Build the color system: generate palettes from a seed, map them to semantic roles with WCAG checks, build gradients, and pair fonts.',
    },
    {
      id: 'identity',
      title: 'Icons &amp; brand',
      blurb: 'Document identity: a searchable icon catalog, a curated icon specimen across the size scale, and the brand mark on light and dark surfaces with clear-space.',
    },
    {
      id: 'theming',
      title: 'Theming',
      blurb: 'Round-trip themes: browse curated public token sets, export the active theme as CSS or DTCG JSON, and apply a <code>tokens.json</code> to a preview scope.',
    },
  ],
};
