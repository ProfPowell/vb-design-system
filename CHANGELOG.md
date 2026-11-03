# Changelog

All notable changes to `@profpowell/vb-design-system` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

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
