/**
 * icon-specimen: Curated icon-language specimen
 *
 * Presents a fixed, curated set of icon names across the project's sizing
 * scale — a design specimen (not a searchable browser like <icon-set>).
 * Each cell renders via <icon-wc> so it shares the design system's real
 * icon-loading/caching/theming path (SVG fetch, currentColor, size tokens)
 * rather than duplicating that logic with a bare [data-icon] primitive,
 * which the mini-site's vendored VB does not ship.
 *
 * @attr {string} set         - Icon set directory (default: "lucide")
 * @attr {string} names       - Space/comma-separated list of icon names (required)
 * @attr {string} data-sizes  - Space-separated size scale (default: "1rem 1.5rem 2rem")
 *
 * @example
 * <icon-specimen names="check x star settings" data-sizes="1rem 1.5rem 2rem"></icon-specimen>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class IconSpecimen extends VBElement {
  static observedAttributes = ['set', 'names', 'data-sizes'];

  setup() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get set() {
    return this.getAttribute('set') || 'lucide';
  }

  get names() {
    return (this.getAttribute('names') || '').split(/[\s,]+/).filter(Boolean);
  }

  get sizes() {
    return (this.getAttribute('data-sizes') || '1rem 1.5rem 2rem').trim().split(/\s+/);
  }

  #render() {
    const { set, names, sizes } = this;
    const cell = (n) => sizes.map((sz) => `
        <td><icon-wc name="${n}" set="${set}" style="font-size:${sz}"></icon-wc></td>`).join('');
    this.innerHTML = `
      <table class="icon-specimen">
        <thead>
          <tr>
            <th scope="col">Icon</th>
            ${sizes.map((sz) => `<th scope="col">${sz}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${names.map((n) => `<tr><th scope="row"><code>${n}</code></th>${cell(n)}</tr>`).join('')}
        </tbody>
      </table>`;
  }
}

registerComponent('icon-specimen', IconSpecimen);

export { IconSpecimen };
