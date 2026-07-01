# @profpowell/vb-design-system

Design-system documentation components for [Vanilla Breeze](https://github.com/ProfPowell/vanilla-breeze) — the building blocks for documenting brand guidelines, design tokens, and visual standards.

These are standalone Web Components extracted from Vanilla Breeze core. They render against Vanilla Breeze **design tokens** (CSS custom properties) but carry their own logic, so you can drop them into any page that loads VB tokens/themes.

## Components

| Tag | Purpose |
|-----|---------|
| `<color-palette>` | Swatches for a color ramp with copy-to-clipboard |
| `<semantic-palette>` | Semantic color roles (surface, text, accent…) derived from tokens |
| `<type-specimen>` | Typography scale specimen |
| `<spacing-specimen>` | Spacing scale specimen |
| `<token-specimen>` | Generic design-token table specimen |
| `<motion-specimen>` | Motion / easing / duration specimen |
| `<component-sampler>` | Live sampler that renders a component across variants |
| `<theme-export>` | Export the active theme as DTCG JSON or CSS |

## Install

```bash
npm install @profpowell/vb-design-system
```

Or load from a CDN (after publish):

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

MIT © Patrick Powell
