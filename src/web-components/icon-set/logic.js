/**
 * icon-set: Searchable icon catalog/browser
 *
 * Renders a filterable grid of icons for a given icon set, with
 * click-to-copy names. Each cell renders via <icon-wc> so it shares the
 * design system's real icon-loading/caching/theming path (SVG fetch,
 * currentColor, size tokens) rather than duplicating that logic.
 *
 * By default it fetches {iconBase}/{set}.json — a manifest listing every
 * icon name in the set. The `names` attribute bypasses that fetch entirely
 * (space/comma-separated list), which is useful for tests, offline demos,
 * or curated subsets where no manifest exists.
 *
 * @attr {string} set   - Icon set directory (default: "lucide")
 * @attr {string} names - Optional space/comma-separated list of icon names.
 *                        Overrides the {iconBase}/{set}.json manifest fetch.
 *
 * @example
 * <icon-set names="star home search settings"></icon-set>
 * <icon-set set="lucide"></icon-set>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const iconBase = () => document.documentElement.dataset.iconPath || '/cdn/icons';

class IconSet extends VBElement {
  static observedAttributes = ['set', 'names'];

  setup() {
    this.#render();
    this.#load();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#load();
    }
  }

  get set() {
    return this.getAttribute('set') || 'lucide';
  }

  async #load() {
    const attr = this.getAttribute('names');
    let names = attr ? attr.split(/[\s,]+/).filter(Boolean) : null;
    if (!names) {
      try {
        names = await (await fetch(`${iconBase()}/${this.set}.json`)).json();
      } catch {
        names = [];
      }
    }
    this.#renderGrid(names);
  }

  #render() {
    this.innerHTML = `
      <div class="icon-set">
        <label class="icon-set__search">
          <span class="visually-hidden">Filter icons</span>
          <input type="search" placeholder="Filter ${this.set} icons…">
        </label>
        <ul class="icon-set__grid" role="list"></ul>
      </div>`;
    const input = /** @type {HTMLInputElement} */ (this.querySelector('input'));
    this.listen(input, 'input', (e) => this.#filter(/** @type {HTMLInputElement} */ (e.target).value));
  }

  #renderGrid(names) {
    const ul = this.querySelector('.icon-set__grid');
    if (!ul) return;
    ul.innerHTML = names.map((n) => `
      <li data-icon-name="${n}">
        <button type="button" title="Copy “${n}”" data-copy="${n}">
          <icon-wc name="${n}" set="${this.set}"></icon-wc>
          <span>${n}</span>
        </button>
      </li>`).join('');
    this.listen(ul, 'click', (e) => {
      const btn = /** @type {HTMLElement} */ (e.target).closest('[data-copy]');
      if (btn) navigator.clipboard?.writeText(/** @type {HTMLElement} */ (btn).dataset.copy ?? '');
    });
  }

  #filter(q) {
    const term = q.trim().toLowerCase();
    for (const li of this.querySelectorAll('[data-icon-name]')) {
      li.hidden = !!term && !(/** @type {HTMLElement} */ (li).dataset.iconName ?? '').toLowerCase().includes(term);
    }
  }
}

registerComponent('icon-set', IconSet);

export { IconSet };
