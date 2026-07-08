# @profpowell/vb-design-system

Design-system documentation components for [Vanilla Breeze](https://github.com/ProfPowell/vanilla-breeze) — the building blocks for documenting brand guidelines, design tokens, and visual standards.

These are standalone Web Components extracted from Vanilla Breeze core. They render against Vanilla Breeze **design tokens** (CSS custom properties) but carry their own logic, so you can drop them into any page that loads VB tokens/themes.

**Docs & live demos:** <https://profpowell.github.io/vb-design-system/>

## Components

Nineteen documentation components, grouped by role.

**Specimens & samplers**

| Tag | Purpose |
|-----|---------|
| `<type-specimen>` | Typography specimen: character grid, weight/type scales, editable text |
| `<spacing-specimen>` | Spacing scale as a bar chart from tokens |
| `<token-specimen>` | Token scale display (shadows, radii, borders, colors, sizes) |
| `<motion-specimen>` | Easing curves + durations from motion tokens |
| `<layout-specimen>` | VB layout primitives with labeled mini-examples + snippets |
| `<breakpoint-specimen>` | Responsive breakpoint ruler with live width readout |
| `<accessibility-specimen>` | WCAG contrast table with AA/AAA badges from color pairs |
| `<component-sampler>` | Themed grid of native UI elements in the active theme |

**Color & palette**

| Tag | Purpose |
|-----|---------|
| `<color-palette>` | Color swatches with click-to-copy and layout modes |
| `<semantic-palette>` | Preview a palette as VB semantic roles with WCAG chips |
| `<palette-generator>` | Generate harmonious palettes from a seed color |
| `<gradient-builder>` | CSS gradient builder with stops, angle, interpolation, export |
| `<font-pairer>` | Font-pairing tool with live preview + CSS export |

**Icons & brand**

| Tag | Purpose |
|-----|---------|
| `<icon-set>` | Searchable icon-set grid with click-to-copy names |
| `<icon-specimen>` | Curated icon specimen across the sizing scale |
| `<brand-specimen>` | Brand-mark specimen: light/dark surfaces, size scale, clear-space |

**Theming**

| Tag | Purpose |
|-----|---------|
| `<theme-catalog>` | Browse + apply curated public token sets (Material, Carbon, Tailwind, …) |
| `<theme-export>` | Export theme overrides as CSS or DTCG JSON |
| `<theme-import>` | Apply a DTCG `tokens.json` to a preview scope |

## Install

```bash
npm install @profpowell/vb-design-system
```

Or load from a CDN:

```html
<script type="module" src="https://unpkg.com/@profpowell/vb-design-system/dist/vb-design-system.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@profpowell/vb-design-system/dist/vb-design-system.min.css">
```

## Usage

Register everything via the barrel, and load the component styles:

```js
import '@profpowell/vb-design-system';        // registers all elements
import '@profpowell/vb-design-system/css';     // light-DOM component styles
```

Or pull a single component (tree-shake friendly):

```js
import '@profpowell/vb-design-system/color-palette';
```

```html
<color-palette ramp="--color-accent"></color-palette>
<theme-export format="dtcg"></theme-export>
```

## Design-token contract

These components are **token-driven**: they read Vanilla Breeze CSS custom properties (`--color-*`, `--font-*`, `--size-*`, `--ease-*`, …) from the host page and inherit the active theme automatically. There is no build-time coupling — load VB's token/theme CSS (or your own compatible tokens) on the page and the components adopt it.

```html
<!-- Provide tokens + theme via Vanilla Breeze, then use the components -->
<link rel="stylesheet" href="https://unpkg.com/vanilla-breeze/dist/cdn/vanilla-breeze.css">
```

`vanilla-breeze` is declared as an **optional peer dependency**: required only if you want VB to supply the tokens/themes (most consumers do). The components degrade to their hardcoded fallbacks without it.

## Relationship to Vanilla Breeze

This package was decomposed out of `vanilla-breeze` core so the framework stays focused on general site-building primitives while design-system tooling versions independently. General components that used to ship here (e.g. `icon-wc`, `brand-mark`) remain in VB core.

## Runtime peers

The following components are provided by **Vanilla Breeze** (VB core) and are used at runtime by DS components but are NOT bundled with this package:

- `<color-picker>` — Used by color-tool components (`semantic-palette`, `palette-generator`, `gradient-builder`). These tools degrade gracefully without it.
- `<drag-surface>` — Interactive drag patterns.
- `<icon-wc>` — Icon system.
- `<brand-mark>` — Brand mark component.
- `<theme-picker>` — Theme switcher.

These are declared as optional peer dependencies in `package.json`. Load `vanilla-breeze` and its token/theme CSS on the page for full functionality.

## Development

```bash
npm run build   # bundle dist/ (esm + minified, js + css) via esbuild
```

A GitHub Pages demo site can depend on `vanilla-breeze` for tokens/themes and import this package directly.

## License
MIT License

© 2026 Thomas A. Powell
