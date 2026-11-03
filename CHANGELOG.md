# Changelog

All notable changes to `@profpowell/vb-design-system` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- `<token-specimen>` color swatches and border samples now carry
  `data-token-sample`, so an `editable` specimen of those types updates the
  sample live like shadow, radius and size already did.
- `<component-sampler>` doc page had code samples but no live demo.

### Internal

- Docs site built with cook-ssg 2.5: `fingerprint` is on (content-hashed
  CSS/JS, `<link>`/`<script>` refs rewritten; `cdn/` and `pagefind/` excluded),
  replacing the `?v=` cache-buster that `publish-docs.js` used to stamp.
- Docs site uses cook HTML collections: the elements index, the home-page
  role chips and every "19 elements" count are generated from each element
  page's front matter (`group`, `order`) via `site/plugins/element-groups.js`
  and the role groups declared in `site/config/data.js`. Stale VB-port front
  matter (`currentPath`, `crumbHref`, `crumbLabel`, `category`) removed.
- Alpenglow showcase: the "Add Vanilla Breeze" switcher loaded the VB bundle
  from a root-absolute JS string, which 404s on the Pages subpath. The bundle
  URL now comes from a `<link rel="modulepreload">` on the page so the build
  can prefix and hash it. Dead `_vb-toggle.js` removed.
- Theme Lab: the "Export design-system page" download linked this site's
  root-relative assets, so the saved file had no styles or scripts anywhere
  but the site root. It now links the unpkg CDN builds of Vanilla Breeze 0.4
  and this pack 0.2 (the README's convention), themes included.
- Theme Lab: the interactive-components surface linked `/src/labs/labs.css`,
  a Vanilla Breeze repo path that never existed here (404, so the `data-labs`
  hover and texture effects were unstyled). The labs stylesheet is now
  vendored from the VB package like the other assets.
- Playwright specs for the seven components that had none: color-palette,
  component-sampler, motion-specimen, spacing-specimen, theme-export,
  token-specimen, type-specimen. Every component is now covered.

## [0.2.0] - 2026-11-02

Tracks Vanilla Breeze 0.4. The peer dependency is now `vanilla-breeze >=0.4.0`.

### Changed (breaking)

- **Size-scale tokens are spelled `s` / `m` / `l`**, matching Vanilla Breeze
  0.4.0's rename. Every component style and every value the components write
  or export now reads `--font-size-s/m/l` and `--shadow-s/m/l` instead of
  `-sm/-md/-lg`. On a page running Vanilla Breeze 0.3 these tokens no longer
  resolve; upgrade VB alongside this package.
- `<type-specimen show-scale>` labels its steps `xs, s, m, l, xl, …` (was
  `xs, sm, md, lg, xl, …`).
- The bundled theme catalog (`theme-catalog`, `theme-import`) is synced from
  Vanilla Breeze v0.4.1: the typography `size` group keys are `s/m/l`, so an
  applied catalog theme writes `--font-size-m`, not the dead `--font-size-md`.

### Fixed

- `<semantic-palette>` no longer appends a second hidden probe element each
  time it is moved in the DOM (reconnect guard).
- README usage example used a `ramp` attribute `<color-palette>` never had.

### Internal

- Shared color math moved from `src/web-components/color-picker/` (a folder
  named for a component that lives in VB core) to `src/lib/color-utils.js`.
- `vb-element.js` doc comment synced from VB core: `data-upgraded` does not
  survive a disconnect, so `setup()` must be idempotent.
- Package author corrected to Thomas A. Powell.
- CI quality gate added (build, dist-current check, Playwright, docs-site
  build). `CLAUDE.md` documents the repo's conventions and release steps.
- Docs site: home page redesigned; built with cook-ssg 2.4 (`siteRoot:
  'pages'` restores active-link marking) and Vanilla Breeze 0.4.1.

## [0.1.0] - 2026-07-06

First publish: the 19 design-system documentation components decomposed out
of Vanilla Breeze 0.3.0.
