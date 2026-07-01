/**
 * brand-specimen: DS specimen documenting a brand mark
 *
 * Shows a `<brand-mark>` on light and dark surfaces, at a size scale, and
 * inside a clear-space box. Pairs with the other identity/token specimens
 * (color-palette, semantic-palette) for brand-guideline pages.
 *
 * `<brand-mark>` itself is a VB-core component (runtime peer) — this
 * specimen only arranges instances of it; it does not re-implement its
 * theme-aware light/dark logo swap.
 *
 * @attr {string} src        - Logo image URL, passed through to `<brand-mark src>`
 * @attr {string} name       - Brand name, passed through as `<brand-mark>` child text content
 * @attr {string} data-sizes - Space-separated `<brand-mark data-size>` values
 *                             for the scale row (default: "s m l xl")
 *
 * @example
 * <brand-specimen src="/logo.svg" name="Acme"></brand-specimen>
 * <brand-specimen src="/logo.svg" name="Acme" data-sizes="xs s m l xl 2xl"></brand-specimen>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class BrandSpecimen extends VBElement {
  static observedAttributes = ['src', 'name', 'data-sizes'];

  setup() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const src = this.getAttribute('src') || '';
    const name = this.getAttribute('name') || 'Brand';
    const sizes = (this.getAttribute('data-sizes') || 's m l xl').trim().split(/\s+/);
    // `<brand-mark>` treats `wordmark` as a boolean presence attribute and
    // reads the displayed brand name from its light-DOM text content — the
    // name must be the element's child text, not the value of `wordmark=`.
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const mark = (size) =>
      `<brand-mark${src ? ` src="${esc(src)}"` : ''} wordmark${size ? ` data-size="${size}"` : ''}>${esc(name)}</brand-mark>`;
    this.innerHTML = `
      <section class="brand-specimen">
        <div class="bs-surfaces">
          <figure data-surface="light">${mark('l')}<figcaption>On light</figcaption></figure>
          <figure data-surface="dark">${mark('l')}<figcaption>On dark</figcaption></figure>
        </div>
        <div class="bs-scale" data-scale>
          ${sizes.map(s => `<span>${mark(s)}<small>${s}</small></span>`).join('')}
        </div>
        <div class="bs-clearspace"><span class="bs-clear-box">${mark('l')}</span>
          <figcaption>Clear space</figcaption></div>
      </section>`;
  }
}

registerComponent('brand-specimen', BrandSpecimen);
